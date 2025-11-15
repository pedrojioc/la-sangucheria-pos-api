import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm'

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => {
    console.log('DATABASE DEBUG')
    console.log(configService.get<string>('database.database'))
    console.log(configService.get<string>('database.ssl'))
    return {
      type: 'postgres',
      host: configService.get<string>('database.host'),
      port: configService.get<number>('database.port'),
      username: configService.get<string>('database.username'),
      password: configService.get<string>('database.password'),
      database: configService.get<string>('database.database'),
      schema: configService.get<string>('database.schema'),
      synchronize: configService.get<boolean>('database.synchronize'),
      logging: configService.get<boolean>('database.logging'),
      ssl: configService.get<boolean>('database.ssl') ? { rejectUnauthorized: false } : false,
      entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
      migrations: [
        __dirname + '/../../shared/infrastructure/database/typeorm/migrations/*{.ts,.js}'
      ],
      migrationsTableName: 'migrations',
      autoLoadEntities: true,
      retryAttempts: configService.get<number>('database.retryAttempts', 3),
      retryDelay: configService.get<number>('database.retryDelay', 3000),
      extra: {
        max: 20, // Máximo de conexiones en el pool
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000
      }
    }
  },
  inject: [ConfigService]
}
