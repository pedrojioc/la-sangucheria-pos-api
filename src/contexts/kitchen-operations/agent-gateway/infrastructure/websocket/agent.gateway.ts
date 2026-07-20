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
import { JwtService } from '@contexts/iam/authentication/domain/services/jwt.service'
import { AcknowledgePrintJob } from '@contexts/kitchen-operations/kitchen-printer/application/acknowledge/acknowledge-print-job'

// The global HTTP JWT guard does NOT cover WebSocket connections — this
// gateway performs its own handshake authentication and disconnects
// unauthenticated sockets.
@WebSocketGateway({ namespace: '/agent' })
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly registry: AgentConnectionRegistry,
    private readonly jwtService: JwtService,
    private readonly acknowledgePrintJob: AcknowledgePrintJob
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    const token = socket.handshake.auth?.token as string | undefined

    if (!token) {
      socket.disconnect(true)
      return
    }

    try {
      await this.jwtService.verifyAccessToken(token)
    } catch {
      socket.disconnect(true)
    }
  }

  handleDisconnect(socket: Socket): void {
    this.registry.unregister(socket)
  }

  @SubscribeMessage('register-agent')
  handleRegisterAgent(@ConnectedSocket() socket: Socket): { registered: boolean } {
    this.registry.register(socket)
    return { registered: true }
  }

  @SubscribeMessage('print-ack')
  async handlePrintAck(@MessageBody() payload: { jobId: string }): Promise<void> {
    await this.acknowledgePrintJob.run(payload.jobId)
  }
}
