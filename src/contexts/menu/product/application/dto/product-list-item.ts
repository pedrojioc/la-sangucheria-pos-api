import { ProductAvailability } from '../services/product-availability-query.service'

export interface ProductListItemOptionItem {
  id: string
  groupId: string
  label: string
  ingredientId: string
  quantity: number
  unitId: string
  extraPrice: number
  sortOrder: number
  isActive: boolean
}

export interface ProductListItemOptionGroup {
  id: string
  name: string
  type: 'SWAP' | 'ADD'
  required: boolean
  minSelections: number
  maxSelections: number
  isActive: boolean
  items: ProductListItemOptionItem[]
}

export interface ProductListItem {
  id: string
  name: string
  description: string | null
  categoryId: string
  categoryName: string
  ingredientId: string | null
  price: number
  imageUrl: string | null
  preparationTime: number | null
  isActive: boolean
  displayOrder: number
  sku: string
  tags: string[]
  inventoryStrategyType: 'RECIPE' | 'DIRECT' | 'NONE'
  availability: ProductAvailability
  optionGroups: ProductListItemOptionGroup[]
  createdAt: Date
  updatedAt: Date
}
