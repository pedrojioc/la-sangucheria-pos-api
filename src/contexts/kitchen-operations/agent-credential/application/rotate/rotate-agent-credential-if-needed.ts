import { AgentCredentialRepository } from '../../domain/repositories/agent-credential.repository'
import { IssueAgentCredential } from '../issue/issue-agent-credential'

export interface RotateAgentCredentialIfNeededResult {
  plainSecret: string
}

// Message-driven-only rotation trigger (design Decision (b) — NO cron, NO
// heartbeat/setInterval). Idempotent, single indexed lookup — cheap enough
// to run on the hot path per-message (caller is expected to throttle calls,
// see AgentGateway.maybeRotate, task B4).
export class RotateAgentCredentialIfNeeded {
  constructor(
    private readonly repository: AgentCredentialRepository,
    private readonly issueAgentCredential: IssueAgentCredential
  ) {}

  async run(establishmentId: string): Promise<RotateAgentCredentialIfNeededResult | null> {
    const now = new Date()
    const active = await this.repository.findActiveByEstablishment(establishmentId)

    if (!active || !active.needsRotation(now)) {
      return null
    }

    // IssueAgentCredential.run() auto-supersedes the existing active
    // credential with the standard 48h grace period — reused UNMODIFIED.
    const { plainSecret } = await this.issueAgentCredential.run(establishmentId)
    return { plainSecret }
  }
}
