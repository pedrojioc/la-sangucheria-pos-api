import { DataSource } from 'typeorm'
import { config } from 'dotenv'

// Cargar variables de entorno
config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
})

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'la_sangucheria_pos',
  schema: process.env.DB_SCHEMA || 'public',
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/src/shared/infrastructure/database/typeorm/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false // SIEMPRE false en producción
})
