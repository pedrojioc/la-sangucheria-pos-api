import { NestFactory } from '@nestjs/core'
import { WorkerModule } from './worker.module'

/**
 * Worker process entry point (Slice: outbox-worker-process).
 *
 * Context-only bootstrap: no HTTP adapter, no listen(), no port bound, no
 * WebSocket adapter, no cookie parser, no global pipes/filters/interceptors/
 * guards — those are all HTTP-specific concerns owned by main.ts /
 * AppModule. This process exists solely to host OutboxPollerService's
 * @Interval(5000) tick against the same Postgres connection as the API.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule)

  app.enableShutdownHooks()

  console.log('🔄 Outbox worker process is running')
}

bootstrap().catch(error => {
  console.error('❌ Failed to start the worker process:', error)
  process.exit(1)
})
