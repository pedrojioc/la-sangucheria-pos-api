// Domain interface (pure TypeScript, no infrastructure dependencies)
export abstract class PasswordHasher {
  abstract hash(plainPassword: string): Promise<string>
  abstract verify(plainPassword: string, hashedPassword: string): Promise<boolean>
}
