// Domain interface (pure TypeScript, no infrastructure dependencies)
export abstract class AgentCredentialSecretHasher {
  abstract hash(plainSecret: string): Promise<string>
  abstract verify(plainSecret: string, hashedSecret: string): Promise<boolean>
}
