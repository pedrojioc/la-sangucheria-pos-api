import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { TableLabelPort } from '../../application/ports/table-label.port'

@Injectable()
export class TypeOrmTableLabelAdapter extends TableLabelPort {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {
    super()
  }

  async findLabelById(tableId: string): Promise<string | null> {
    const rows: Array<{ number: string }> = await this.dataSource.query(
      `SELECT number FROM tables WHERE id = $1 LIMIT 1`,
      [tableId]
    )

    return rows.length > 0 ? rows[0].number : null
  }
}
