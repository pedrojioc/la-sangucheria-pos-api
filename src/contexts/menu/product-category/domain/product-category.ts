import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { ProductCategoryId } from '@/contexts/menu/product-category/domain/product-category-id'
import { ProductCategoryName } from '@/contexts/menu/product-category/domain/product-category-name'
import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'
import { ProductCategoryDescription } from '@/contexts/menu/product-category/domain/product-category-description'
import { ProductCategoryIsActive } from '@/contexts/menu/product-category/domain/product-category-is-active'
import { ProductCategoryDisplayOrder } from '@/contexts/menu/product-category/domain/product-category-display-order'
import { ProductCategoryIcon } from '@/contexts/menu/product-category/domain/product-category-icon'

interface ProductCategoryPrimitives {
  id: string
  name: string
  description: string | null
  icon: string | null
  isActive: boolean
  displayOrder: number
}

export class ProductCategory extends AggregateRoot {
  constructor(
    private readonly id: ProductCategoryId,
    private name: ProductCategoryName,
    private description: ProductCategoryDescription | null,
    private icon: ProductCategoryIcon | null,
    private isActive: ProductCategoryIsActive,
    private displayOrder: ProductCategoryDisplayOrder
  ) {
    super()
  }

  static fromPrimitives(primitives: ProductCategoryPrimitives) {
    return new ProductCategory(
      new ProductCategoryId(primitives.id),
      new ProductCategoryName(primitives.name),
      primitives.description ? new ProductCategoryDescription(primitives.description) : null,
      primitives.icon ? new ProductCategoryIcon(primitives.icon) : null,
      new ProductCategoryIsActive(primitives.isActive),
      new ProductCategoryDisplayOrder(primitives.displayOrder)
    )
  }

  static create(
    id: string,
    name: string,
    description: string | null,
    icon: string | null,
    isActive: boolean,
    displayOrder: number
  ): ProductCategory {
    const category = ProductCategory.fromPrimitives({
      id,
      name,
      description,
      icon,
      isActive,
      displayOrder
    })
    // category.record()
    return category
  }

  update(
    name: string,
    description: string | null,
    icon: string | null,
    isActive: boolean,
    displayOrder: number
  ): void {
    this.name = new ProductCategoryName(name)
    this.description = description ? new ProductCategoryDescription(description) : null
    this.icon = icon ? new ProductCategoryIcon(icon) : null
    this.isActive = new ProductCategoryIsActive(isActive)
    this.displayOrder = new ProductCategoryDisplayOrder(displayOrder)
  }

  changeName(newName: ProductCategoryName): ProductCategory {
    if (this.name.equals(newName)) {
      throw new BusinessRuleViolationException('New name must be different from current name')
    }

    return new ProductCategory(
      this.id,
      newName,
      this.description,
      this.icon,
      this.isActive,
      this.displayOrder
    )
  }

  toPrimitives() {
    return {
      id: this.id.value,
      name: this.name.value,
      description: this.description?.value ?? null,
      icon: this.icon?.value ?? null,
      isActive: this.isActive.value,
      displayOrder: this.displayOrder.value
    }
  }
}
