import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets'
import { Socket } from 'socket.io'

import { AgentConnectionRegistry } from '@contexts/kitchen-operations/agent-gateway/domain/agent-connection-registry'
import { AgentCredentialVerifierPort } from '@contexts/kitchen-operations/agent-credential/domain/services/agent-credential-verifier.port'
import { RotateAgentCredentialIfNeeded } from '@contexts/kitchen-operations/agent-credential/application/rotate/rotate-agent-credential-if-needed'
import { AcknowledgePrintJob } from '@contexts/kitchen-operations/kitchen-printer/application/acknowledge/acknowledge-print-job'
import { ReportPrintJobFailure } from '@contexts/kitchen-operations/kitchen-printer/application/report-print-job-failure/report-print-job-failure'
import { FailureReason } from '@contexts/kitchen-operations/kitchen-printer/domain/kitchen-ticket-print-job'
import { RecordDiscoveredDevice } from '@contexts/kitchen-operations/printer-discovery/application/record/record-discovered-device'
import { DiscoveredPrinterDeviceConnectionType } from '@contexts/kitchen-operations/printer-discovery/domain/discovered-printer-device'
import { EstablishmentId } from '@contexts/establishment/establishment/domain/establishment-id'

interface ReportDevicesPayload {
  devices: Array<{
    connectionType: DiscoveredPrinterDeviceConnectionType
    address?: string
    usbIdentifier?: string
  }>
}

// Closed set of failure reasons a USB print agent can distinguish. Validated
// manually here (no class-validator/DTO) to match this gateway's existing
// no-payload-validation posture for WS messages (cf. print-ack's raw
// { jobId: string } access).
const FAILURE_REASONS: FailureReason[] = ['out-of-paper', 'offline', 'jammed', 'unknown']

// Sockets authenticated on this namespace get their resolved EstablishmentId
// stashed here for the lifetime of the connection (register/report-devices/
// disconnect all need it, and socket.io gives us no other typed extension
// point without augmenting the library's Socket interface).
const resolvedEstablishmentIds = new WeakMap<Socket, EstablishmentId>()

// Per-socket "last rotation-checked" throttle so busy print traffic does not
// hammer RotateAgentCredentialIfNeeded's DB lookup on every message — the
// vast majority of inbound messages short-circuit on this cheap timestamp
// comparison. Message-driven-only rotation (design Decision (b)): NO
// setInterval, NO cron, NO connection/disconnect wiring changes for rotation.
const lastRotationCheckedAt = new WeakMap<Socket, number>()
const ROTATION_CHECK_THROTTLE_MS = 60 * 1000

// The global HTTP JWT guard does NOT cover WebSocket connections — this
// gateway performs its own handshake authentication and disconnects
// unauthenticated sockets. Authentication is now via AgentCredentialVerifierPort
// (establishment-scoped pairing key), not a human JWT.
@WebSocketGateway({ namespace: '/agent' })
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly registry: AgentConnectionRegistry,
    private readonly verifier: AgentCredentialVerifierPort,
    private readonly acknowledgePrintJob: AcknowledgePrintJob,
    private readonly reportPrintJobFailure: ReportPrintJobFailure,
    private readonly recordDiscoveredDevice: RecordDiscoveredDevice,
    private readonly rotateAgentCredentialIfNeeded: RotateAgentCredentialIfNeeded
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    const key = socket.handshake.auth?.key as string | undefined

    if (!key) {
      socket.disconnect(true)
      return
    }

    const establishmentId = await this.verifier.verify(key)

    if (!establishmentId) {
      socket.disconnect(true)
      return
    }

    resolvedEstablishmentIds.set(socket, new EstablishmentId(establishmentId))
  }

  handleDisconnect(socket: Socket): void {
    const establishmentId = resolvedEstablishmentIds.get(socket)
    if (!establishmentId) return

    this.registry.unregister(establishmentId, socket)
    resolvedEstablishmentIds.delete(socket)
    lastRotationCheckedAt.delete(socket)
  }

  @SubscribeMessage('register-agent')
  handleRegisterAgent(@ConnectedSocket() socket: Socket): { registered: boolean } {
    void this.maybeRotate(socket)

    const establishmentId = resolvedEstablishmentIds.get(socket)
    if (!establishmentId) return { registered: false }

    this.registry.register(establishmentId, socket)
    return { registered: true }
  }

  @SubscribeMessage('print-ack')
  async handlePrintAck(
    @MessageBody() payload: { jobId: string },
    @ConnectedSocket() socket: Socket
  ): Promise<void> {
    await this.maybeRotate(socket)
    await this.acknowledgePrintJob.run(payload.jobId)
  }

  @SubscribeMessage('print-nack')
  async handlePrintNack(
    @MessageBody() payload: { jobId: string; reason: string },
    @ConnectedSocket() socket: Socket
  ): Promise<void> {
    await this.maybeRotate(socket)

    // Reject-and-stop on an invalid reason: log + return WITHOUT calling the
    // use case, so the job's status never transitions. 'unknown' is a
    // legitimate agent-supplied value, not a coercion sink for garbage input.
    if (!FAILURE_REASONS.includes(payload.reason as FailureReason)) {
      console.warn('AgentGateway: received print-nack with invalid reason; dropping', {
        jobId: payload.jobId,
        reason: payload.reason
      })
      return
    }

    await this.reportPrintJobFailure.run(payload.jobId, payload.reason as FailureReason)
  }

  @SubscribeMessage('report-devices')
  async handleReportDevices(
    @MessageBody() payload: ReportDevicesPayload,
    @ConnectedSocket() socket: Socket
  ): Promise<void> {
    await this.maybeRotate(socket)

    const establishmentId = resolvedEstablishmentIds.get(socket)
    if (!establishmentId) return

    for (const device of payload.devices) {
      await this.recordDiscoveredDevice.run({
        establishmentId: establishmentId.value,
        connectionType: device.connectionType,
        address: device.address,
        usbIdentifier: device.usbIdentifier
      })
    }
  }

  // Pure side-effecting prefix — never alters the caller's own handler
  // contract or business behavior. Delivers a rotated credential over the
  // SAME live socket that triggered the check (no registry lookup needed).
  private async maybeRotate(socket: Socket): Promise<void> {
    const establishmentId = resolvedEstablishmentIds.get(socket)
    if (!establishmentId) return

    const now = Date.now()
    const lastChecked = lastRotationCheckedAt.get(socket)
    if (lastChecked !== undefined && now - lastChecked < ROTATION_CHECK_THROTTLE_MS) {
      return
    }
    lastRotationCheckedAt.set(socket, now)

    const rotated = await this.rotateAgentCredentialIfNeeded.run(establishmentId.value)
    if (rotated) {
      socket.emit('agent-credential-rotated', { apiKey: rotated.plainSecret })
    }
  }
}
