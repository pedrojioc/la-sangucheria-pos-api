export const REPOSITORY_TOKENS = {
  PRODUCT_REPOSITORY: Symbol('IProductRepository'),
  CATEGORY_REPOSITORY: Symbol('ICategoryRepository'),
  TABLE_REPOSITORY: Symbol('ITableRepository'),
  ORDER_REPOSITORY: Symbol('IOrderRepository'),
  EMPLOYEE_REPOSITORY: Symbol('IEmployeeRepository'),
  INVENTORY_ITEM_REPOSITORY: Symbol('IInventoryItemRepository'),
  INVENTORY_MOVEMENT_REPOSITORY: Symbol('IInventoryMovementRepository'),
  RECIPE_REPOSITORY: Symbol('IRecipeRepository')
} as const
