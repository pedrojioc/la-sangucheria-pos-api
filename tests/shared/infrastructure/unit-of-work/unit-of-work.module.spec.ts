import { Test } from '@nestjs/testing'

import { UnitOfWorkModule } from '@shared/infrastructure/unit-of-work/unit-of-work.module'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

describe('UnitOfWorkModule', () => {
  it('exports UnitOfWorkContextHolder as an injectable provider', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UnitOfWorkModule]
    }).compile()

    const holder = moduleRef.get(UnitOfWorkContextHolder)

    expect(holder).toBeInstanceOf(UnitOfWorkContextHolder)
  })
})
