import { Type } from 'class-transformer'
import { IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator'

class AssignmentItemRequest {
  @IsUUID()
  id: string

  @IsInt()
  @Min(0)
  sortOrder: number
}

export class AssignProductOptionGroupsRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignmentItemRequest)
  groups: AssignmentItemRequest[]
}
