export interface ProductCategoryListItemStation {
  id: string
  name: string
  color: string | null
}

export interface ProductCategoryListItem {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  displayOrder: number
  isActive: boolean
  defaultStationId: string | null
  station: ProductCategoryListItemStation | null
}
