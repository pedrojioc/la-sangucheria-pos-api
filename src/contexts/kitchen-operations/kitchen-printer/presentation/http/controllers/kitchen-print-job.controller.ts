import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'

import { FindUnprintedPrintJobs } from '../../../application/find-unprinted/find-unprinted-print-jobs'
import { ReprintKitchenTicket } from '../../../application/reprint/reprint-kitchen-ticket'
import { KitchenPrintJobResponse } from '../../../application/dto/kitchen-print-job.response'

@Controller('kitchen-print-jobs')
export class KitchenPrintJobController {
  constructor(
    private readonly findUnprintedPrintJobs: FindUnprintedPrintJobs,
    private readonly reprintKitchenTicket: ReprintKitchenTicket
  ) {}

  @Get()
  async findUnprinted(): Promise<KitchenPrintJobResponse[]> {
    const jobs = await this.findUnprintedPrintJobs.run()
    return jobs.map(KitchenPrintJobResponse.fromAggregate)
  }

  @Post(':id/reprint')
  @HttpCode(HttpStatus.OK)
  async reprint(@Param('id') id: string): Promise<void> {
    await this.reprintKitchenTicket.run(id)
  }
}
