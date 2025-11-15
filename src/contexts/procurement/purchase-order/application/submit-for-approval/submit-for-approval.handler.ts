import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { SubmitForApprovalCommand } from './submit-for-approval.command'
import { SubmitForApproval } from './submit-for-approval'

@CommandHandler(SubmitForApprovalCommand)
export class SubmitForApprovalHandler implements ICommandHandler<SubmitForApprovalCommand> {
  constructor(private readonly useCase: SubmitForApproval) {}

  async execute(command: SubmitForApprovalCommand): Promise<void> {
    await this.useCase.run(command.purchaseOrderId)
  }
}
