import { Module, Global } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { typeOrmConfig } from './typeorm.config'
import databaseConfig from './database.config'

@Global()
@Module({
  imports: [ConfigModule.forFeature(databaseConfig), TypeOrmModule.forRootAsync(typeOrmConfig)],
  exports: [TypeOrmModule]
})
export class DatabaseModule {}
