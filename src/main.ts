import { NestFactory, Reflector } from '@nestjs/core'
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { DomainExceptionFilter } from './core/filters/domain-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  )

  // Global filters (order matters - more specific first)
  app.useGlobalFilters(new DomainExceptionFilter())
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector))) // Activate serializer

  // Enable CORS for development
  if (process.env.NODE_ENV === 'development') {
    app.enableCors({
      origin: true,
      credentials: true
    })
  }

  const port = process.env.PORT || 3000
  await app.listen(port)

  console.log(`🚀 Application is running on: http://localhost:${port}`)
}

bootstrap().catch(error => {
  console.error('❌ Failed to start the application:', error)
  process.exit(1)
})
