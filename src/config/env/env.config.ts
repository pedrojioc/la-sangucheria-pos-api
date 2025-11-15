import { ConfigModule } from '@nestjs/config'
import { validate } from './env.validation'

export const EnvConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
  validate,
  cache: true
})
