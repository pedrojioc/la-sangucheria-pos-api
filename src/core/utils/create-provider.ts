import { Provider } from '@nestjs/common'

export function createProvider<T>(
  target: new (...args: any[]) => T,
  dependencies: any[]
): Provider {
  return {
    provide: target,
    useFactory: (...deps: any[]) => {
      return new target(...deps)
    },
    inject: dependencies
  }
}
