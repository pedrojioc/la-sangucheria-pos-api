import { IsString, IsEnum, IsBoolean, MaxLength, IsNotEmpty, IsUUID } from 'class-validator'
import { UnitTypeEnum } from '../../../domain/unit-type'

export class CreateUnitRequest {
  @IsUUID()
  @IsNotEmpty()
  id: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  symbol: string

  @IsEnum(UnitTypeEnum)
  type: UnitTypeEnum

  @IsBoolean()
  isActive: boolean
}
