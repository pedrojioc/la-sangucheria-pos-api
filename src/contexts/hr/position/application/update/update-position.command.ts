export class UpdatePositionCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly color: string | null,
    public readonly icon: string | null
  ) {}
}
