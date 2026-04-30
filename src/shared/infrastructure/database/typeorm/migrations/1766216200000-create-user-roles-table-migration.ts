import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm'

export class CreateUserRolesTable1766216200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type
    await queryRunner.query(`
      CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN', 'VIEWER')
    `)

    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'role',
            type: 'user_role_enum',
            isNullable: false
          },
          {
            name: 'granted_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          },
          {
            name: 'granted_by_user_id',
            type: 'uuid',
            isNullable: true
          }
        ]
      }),
      true
    )

    // Create indexes
    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'idx_user_roles_user_id',
        columnNames: ['user_id']
      })
    )

    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'idx_user_roles_role',
        columnNames: ['role']
      })
    )

    // Create unique constraint
    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'uq_user_roles_user_id_role',
        columnNames: ['user_id', 'role'],
        isUnique: true
      })
    )

    // Create foreign keys
    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      })
    )

    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        columnNames: ['granted_by_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL'
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_roles')
    if (table) {
      const foreignKeys = table.foreignKeys
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('user_roles', foreignKey)
      }
    }
    await queryRunner.dropTable('user_roles')
    await queryRunner.query(`DROP TYPE user_role_enum`)
  }
}
