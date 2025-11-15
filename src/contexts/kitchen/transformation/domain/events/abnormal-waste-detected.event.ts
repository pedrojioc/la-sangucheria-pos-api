import { DomainEvent, DomainEventMetadata, DomainEventFromPrimitivesParams } from '@/shared/domain/events'

export interface AbnormalWasteDetectedEventPayload {
  transformationId: string
  recipeId: string
  recipeName: string
  baseIngredientId: string
  outputIngredientId: string
  inputQuantity: number
  inputUnitId: string
  expectedOutput: number
  actualOutput: number
  outputUnitId: string
  expectedWaste: number
  actualWaste: number
  yieldVariancePercentage: number
  performedAt: Date
  performedBy: string | null
}

/**
 * AbnormalWasteDetectedEvent - Domain Event
 *
 * Se dispara cuando el rendimiento real de una transformación difiere
 * significativamente del rendimiento esperado definido en la receta.
 *
 * Ejemplo:
 * - Receta espera: 50% yield (2.5kg de 5kg)
 * - Real obtenido: 42% yield (2.1kg de 5kg)
 * - Varianza: -16% (8% menos de lo esperado)
 * → Evento disparado si threshold es 10%
 *
 * Uso:
 * - Alertas al personal de cocina
 * - Análisis de calidad de materia prima
 * - Detección de problemas en proceso
 * - Reportes de eficiencia
 */
export class AbnormalWasteDetectedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'ingredient.transformation.abnormal_waste_detected'
  static readonly VERSION = 1

  constructor(
    payload: AbnormalWasteDetectedEventPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: AbnormalWasteDetectedEvent.EVENT_NAME,
      aggregateId: payload.transformationId,
      version: AbnormalWasteDetectedEvent.VERSION,
      payload,
      metadata,
      eventId,
      occurredOn
    })
  }

  toPrimitives(): AbnormalWasteDetectedEventPayload {
    return {
      ...this.payload,
      performedAt: this.payload.performedAt.toISOString() as any
    }
  }

  static fromPrimitives(params: DomainEventFromPrimitivesParams): AbnormalWasteDetectedEvent {
    const typedPayload: AbnormalWasteDetectedEventPayload = {
      transformationId: params.payload.transformationId as string,
      recipeId: params.payload.recipeId as string,
      recipeName: params.payload.recipeName as string,
      baseIngredientId: params.payload.baseIngredientId as string,
      outputIngredientId: params.payload.outputIngredientId as string,
      inputQuantity: params.payload.inputQuantity as number,
      inputUnitId: params.payload.inputUnitId as string,
      expectedOutput: params.payload.expectedOutput as number,
      actualOutput: params.payload.actualOutput as number,
      outputUnitId: params.payload.outputUnitId as string,
      expectedWaste: params.payload.expectedWaste as number,
      actualWaste: params.payload.actualWaste as number,
      yieldVariancePercentage: params.payload.yieldVariancePercentage as number,
      performedAt: new Date(params.payload.performedAt as string),
      performedBy: (params.payload.performedBy as string) || null
    }

    return new AbnormalWasteDetectedEvent(
      typedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
