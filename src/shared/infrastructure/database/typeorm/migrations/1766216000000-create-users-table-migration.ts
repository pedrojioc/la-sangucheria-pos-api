import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateUsersTable1766216000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true
          },
          {
            name: 'username',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'full_name',
            type: 'varchar',
            length: '200',
            isNullable: true
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false
          },
          {
            name: 'is_email_verified',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          },
          {
            name: 'last_login_at',
            type: 'timestamp',
            isNullable: true
          }
        ]
      }),
      true
    )

    // Create indexes
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_username',
        columnNames: ['username']
      })
    )

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_email',
        columnNames: ['email']
      })
    )

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_is_active',
        columnNames: ['is_active']
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users')
  }
}
