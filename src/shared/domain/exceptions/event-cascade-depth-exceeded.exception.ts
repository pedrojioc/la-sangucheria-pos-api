import { DomainException } from './domain.exception'

export const MAX_CASCADE_DEPTH = 10

export class EventCascadeDepthExceeded extends DomainException {
  constructor(maxDepth: number = MAX_CASCADE_DEPTH) {
    super(
      `Event cascade depth exceeded the maximum of ${maxDepth}. ` +
        'A subscriber is likely re-publishing events in a cycle.'
    )
  }
}
