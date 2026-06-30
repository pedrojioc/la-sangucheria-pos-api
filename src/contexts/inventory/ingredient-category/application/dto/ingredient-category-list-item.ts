export interface IngredientCategoryListItem {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  sortOrder: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
