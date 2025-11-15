import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * RefactorEventStoreToEnterpriseGradeMigration
 *
 * Refactoriza la tabla event_store para seguir patrones enterprise de Event Sourcing.
 *
 * Cambios principales:
 * 1. Separa event_data en payload (datos de negocio) y metadata (contexto)
 * 2. Agrega event_schema_version para event upcasting
 * 3. Agrega correlation_id para distributed tracing
 * 4. Agrega created_at para monitoreo de latencia
 * 5. Cambia occurred_at a TIMESTAMP WITH TIME ZONE
 * 6. Agrega índices optimizados para queries comunes
 * 7. Agrega constraint UNIQUE(aggregate_id, version) para optimistic locking
 *
 * Referencias:
 * - Greg Young: Event Store Design
 * - Martin Fowler: Event Sourcing
 *
 * @since Sprint 2: Event Sourcing Refactor
 */
export class RefactorEventStoreToEnterpriseGradeMigration1762213019176
  implements MigrationInterface
{
  name = 'RefactorEventStoreToEnterpriseGradeMigration1762213019176'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar índices antiguos
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_cdce9d75f75357aca22cd8f53c"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_2f4a5f4724d91483fbded34fd2"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_12181b5b991a911c368c652a49"`)

    // 2. Agregar nuevas columnas (antes de eliminar event_data)
    await queryRunner.query(
      `ALTER TABLE "event_store" ADD COLUMN "event_schema_version" integer NOT NULL DEFAULT 1`
    )
    await queryRunner.query(`ALTER TABLE "event_store" ADD COLUMN "payload" jsonb`)
    await queryRunner.query(
      `ALTER TABLE "event_store" ADD COLUMN "correlation_id" character varying(100)`
    )
    await queryRunner.query(
      `ALTER TABLE "event_store" ADD COLUMN "created_at" TIMESTAMP NOT NULL DEFAULT now()`
    )

    // 3. Migrar datos existentes de event_data a payload
    // Si event_data tiene estructura anidada { eventId, aggregateId, attributes: {...} }
    // extraemos solo attributes y lo ponemos en payload
    await queryRunner.query(`
      UPDATE "event_store"
      SET "payload" = CASE
        WHEN "event_data"::jsonb ? 'attributes' THEN "event_data"::jsonb -> 'attributes'
        ELSE "event_data"::jsonb
      END
      WHERE "event_data" IS NOT NULL
    `)

    // 4. Extraer correlation_id de metadata si existe
    await queryRunner.query(`
      UPDATE "event_store"
      SET "correlation_id" = "metadata"::jsonb ->> 'correlationId'
      WHERE "metadata" IS NOT NULL
        AND "metadata"::jsonb ? 'correlationId'
    `)

    // 5. Hacer payload NOT NULL ahora que tiene datos
    await queryRunner.query(`ALTER TABLE "event_store" ALTER COLUMN "payload" SET NOT NULL`)

    // 6. Eliminar event_data antiguo
    await queryRunner.query(`ALTER TABLE "event_store" DROP COLUMN "event_data"`)

    // 7. Actualizar occurred_at a TIMESTAMP WITH TIME ZONE
    await queryRunner.query(`ALTER TABLE "event_store" DROP COLUMN "occurred_at"`)
    await queryRunner.query(
      `ALTER TABLE "event_store" ADD COLUMN "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    )

    // 8. Crear nuevos índices optimizados
    await queryRunner.query(
      `CREATE INDEX "idx_event_store_aggregate_stream" ON "event_store" ("aggregate_id", "version")`
    )
    await queryRunner.query(
      `CREATE INDEX "idx_event_store_aggregate_type" ON "event_store" ("aggregate_type")`
    )
    await queryRunner.query(
      `CREATE INDEX "idx_event_store_event_type" ON "event_store" ("event_type")`
    )
    await queryRunner.query(
      `CREATE INDEX "idx_event_store_occurred_at" ON "event_store" ("occurred_at")`
    )
    await queryRunner.query(
      `CREATE INDEX "idx_event_store_correlation_id" ON "event_store" ("correlation_id") WHERE "correlation_id" IS NOT NULL`
    )

    // 9. Agregar constraint UNIQUE para optimistic locking
    await queryRunner.query(
      `ALTER TABLE "event_store" ADD CONSTRAINT "uq_event_store_aggregate_version" UNIQUE ("aggregate_id", "version")`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir en orden inverso

    // 1. Eliminar constraint
    await queryRunner.query(
      `ALTER TABLE "event_store" DROP CONSTRAINT "uq_event_store_aggregate_version"`
    )

    // 2. Eliminar nuevos índices
    await queryRunner.query(`DROP INDEX "public"."idx_event_store_aggregate_stream"`)
    await queryRunner.query(`DROP INDEX "public"."idx_event_store_aggregate_type"`)
    await queryRunner.query(`DROP INDEX "public"."idx_event_store_event_type"`)
    await queryRunner.query(`DROP INDEX "public"."idx_event_store_occurred_at"`)
    await queryRunner.query(`DROP INDEX "public"."idx_event_store_correlation_id"`)

    // 3. Restaurar event_data
    await queryRunner.query(`ALTER TABLE "event_store" ADD COLUMN "event_data" jsonb`)

    // 4. Migrar datos de vuelta a event_data (reconstruir estructura anidada)
    await queryRunner.query(`
      UPDATE "event_store"
      SET "event_data" = jsonb_build_object(
        'attributes', "payload"
      )
      WHERE "payload" IS NOT NULL
    `)

    await queryRunner.query(`ALTER TABLE "event_store" ALTER COLUMN "event_data" SET NOT NULL`)

    // 5. Restaurar occurred_at como TIMESTAMP simple
    await queryRunner.query(`ALTER TABLE "event_store" DROP COLUMN "occurred_at"`)
    await queryRunner.query(
      `ALTER TABLE "event_store" ADD COLUMN "occurred_at" TIMESTAMP NOT NULL DEFAULT now()`
    )

    // 6. Eliminar nuevas columnas
    await queryRunner.query(`ALTER TABLE "event_store" DROP COLUMN "created_at"`)
    await queryRunner.query(`ALTER TABLE "event_store" DROP COLUMN "correlation_id"`)
    await queryRunner.query(`ALTER TABLE "event_store" DROP COLUMN "payload"`)
    await queryRunner.query(`ALTER TABLE "event_store" DROP COLUMN "event_schema_version"`)

    // 7. Restaurar índices antiguos
    await queryRunner.query(
      `CREATE INDEX "IDX_cdce9d75f75357aca22cd8f53c" ON "event_store" ("version")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_2f4a5f4724d91483fbded34fd2" ON "event_store" ("aggregate_type")`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_12181b5b991a911c368c652a49" ON "event_store" ("aggregate_id")`
    )
  }
}
