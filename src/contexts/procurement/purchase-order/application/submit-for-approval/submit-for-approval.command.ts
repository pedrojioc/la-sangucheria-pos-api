export class SubmitForApprovalCommand {
  constructor(
    public readonly purchaseOrderId: string,
    public readonly submittedBy: string
  ) {}
}
