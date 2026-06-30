import { OptionGroup } from '../option-group'
import { OptionGroupId } from '../option-group-id'

export abstract class OptionGroupRepository {
  abstract save(group: OptionGroup): Promise<void>
  abstract search(id: OptionGroupId): Promise<OptionGroup | null>
  abstract searchAll(): Promise<OptionGroup[]>
  abstract findByIds(ids: string[]): Promise<OptionGroup[]>
  abstract delete(id: OptionGroupId): Promise<void>
  abstract isAssignedToAnyProduct(id: OptionGroupId): Promise<boolean>
}
