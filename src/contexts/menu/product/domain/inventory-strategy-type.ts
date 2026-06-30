export type InventoryStrategyType = 'RECIPE' | 'DIRECT' | 'NONE'

const VALID_TYPES: InventoryStrategyType[] = ['RECIPE', 'DIRECT', 'NONE']

export function isValidInventoryStrategyType(value: string): value is InventoryStrategyType {
  return VALID_TYPES.includes(value as InventoryStrategyType)
}
