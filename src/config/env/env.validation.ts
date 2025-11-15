import { plainToInstance, Transform, Type } from 'class-transformer'
import { IsEnum, IsNumber, IsString, IsBoolean, validateSync, IsOptional } from 'class-validator'

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test'
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment

  @Type(() => Number)
  @IsNumber()
  PORT: number

  @IsString()
  APP_NAME: string

  // Database
  @IsString()
  DB_TYPE: string

  @IsString()
  DB_HOST: string

  @Type(() => Number)
  @IsNumber()
  DB_PORT: number

  @IsString()
  DB_USERNAME: string

  @IsString()
  DB_PASSWORD: string

  @IsString()
  DB_DATABASE: string

  @IsString()
  @IsOptional()
  DB_SCHEMA?: string

  @IsBoolean()
  @Transform(({ value }) => {
    return value.toLowerCase() === 'true'
  })
  DB_SYNCHRONIZE: boolean

  @IsBoolean()
  @Transform(({ value }) => {
    return value.toLowerCase() === 'true'
  })
  DB_LOGGING: boolean

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    return value.toLowerCase() === 'true'
  })
  DB_SSL?: boolean

  // API
  @IsString()
  API_PREFIX: string

  @IsString()
  API_VERSION: string

  // CORS
  @IsBoolean()
  @Transform(({ value }) => {
    return value.toLowerCase() === 'true'
  })
  CORS_ENABLED: boolean

  @IsString()
  CORS_ORIGIN: string

  // JWT
  @IsString()
  JWT_SECRET: string

  @IsString()
  JWT_EXPIRATION: string

  // Logging
  @IsString()
  LOG_LEVEL: string
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false
  })

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false
  })

  if (errors.length > 0) {
    throw new Error(errors.toString())
  }

  return validatedConfig
}
