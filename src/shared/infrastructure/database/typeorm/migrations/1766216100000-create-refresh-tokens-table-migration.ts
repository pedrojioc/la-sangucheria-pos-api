import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm'

export class CreateRefreshTokensTable1766216100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true
          },
          {
            name: 'jti',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'token_hash',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false
          },
          {
            name: 'is_revoked',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'revoked_at',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'revoked_reason',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true
          },
          {
            name: 'replaced_by_jti',
            type: 'varchar',
            length: '255',
            isNullable: true
          }
        ]
      }),
      true
    )

    // Create indexes
    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'idx_refresh_tokens_jti',
        columnNames: ['jti']
      })
    )

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'idx_refresh_tokens_user_id',
        columnNames: ['user_id']
      })
    )

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'idx_refresh_tokens_expires_at',
        columnNames: ['expires_at']
      })
    )

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'idx_refresh_tokens_is_revoked',
        columnNames: ['is_revoked']
      })
    )

    // Create foreign key
    await queryRunner.createForeignKey(
      'refresh_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('refresh_tokens')
    if (table) {
      const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('user_id') !== -1)
      if (foreignKey) {
        await queryRunner.dropForeignKey('refresh_tokens', foreignKey)
      }
    }
    await queryRunner.dropTable('refresh_tokens')
  }
}
