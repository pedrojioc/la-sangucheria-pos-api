import { Establishment } from '../establishment'

export abstract class EstablishmentRepository {
  abstract findSingleton(): Promise<Establishment>
  abstract save(establishment: Establishment): Promise<void>
}
