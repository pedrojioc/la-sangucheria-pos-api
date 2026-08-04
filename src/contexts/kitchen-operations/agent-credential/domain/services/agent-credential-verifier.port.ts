export abstract class AgentCredentialVerifierPort {
  // Returns the matching EstablishmentId (as string) on a successful match, or null otherwise.
  abstract verify(plainSecret: string): Promise<string | null>
}
