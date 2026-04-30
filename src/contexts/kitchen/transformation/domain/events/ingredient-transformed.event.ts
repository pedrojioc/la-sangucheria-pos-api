import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

export interface IngredientTransformedEventPayload {
  transformationId: string
  recipeId: string
  baseIngredientId: string
  outputIngredientId: string
  inputQuantity: number
  inputUnitId: string
  outputQuantity: number
  outputUnitId: string
  wasteQuantity: number
  totalCost: number
  outputUnitCost: number
  currency: string
  performedAt: Date
  performedBy: string | null
}

export class IngredientTransformedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'ingredient.transformed'
  static readonly VERSION = 1

  constructor(
    payload: IngredientTransformedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: IngredientTransformedEvent.EVENT_NAME,
      aggregateId: payload.transformationId,
      version: IngredientTransformedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): IngredientTransformedEventPayload {
    return {
      ...this.payload,
      performedAt: this.payload.performedAt.toISOString() as any
    }
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): IngredientTransformedEvent {
    const typedPayload: IngredientTransformedEventPayload = {
      transformationId: params.payload.transformationId as string,
      recipeId: params.payload.recipeId as string,
      baseIngredientId: params.payload.baseIngredientId as string,
      outputIngredientId: params.payload.outputIngredientId as string,
      inputQuantity: params.payload.inputQuantity as number,
      inputUnitId: params.payload.inputUnitId as string,
      outputQuantity: params.payload.outputQuantity as number,
      outputUnitId: params.payload.outputUnitId as string,
      wasteQuantity: params.payload.wasteQuantity as number,
      totalCost: params.payload.totalCost as number,
      outputUnitCost: params.payload.outputUnitCost as number,
      currency: params.payload.currency as string,
      performedAt: new Date(params.payload.performedAt as string),
      performedBy: (params.payload.performedBy as string) || null
    }

    return new IngredientTransformedEvent(
      typedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
