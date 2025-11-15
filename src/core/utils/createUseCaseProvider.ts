import { Provider } from '@nestjs/common'

export function createUseCaseProvider<T>(
  useCase: new (...args: any[]) => T,
  dependencies: any[]
): Provider {
  return {
    provide: useCase,
    useFactory: (...deps: any[]) => {
      return new useCase(...deps)
    },
    inject: dependencies
  }
}
