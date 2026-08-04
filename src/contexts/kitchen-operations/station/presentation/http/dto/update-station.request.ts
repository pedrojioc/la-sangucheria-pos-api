import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength
} from 'class-validator'
import { StationOutputDeviceEnum } from '@contexts/kitchen-operations/station/domain/station-output-device'
import { StationConnectionTypeEnum } from '@contexts/kitchen-operations/station/domain/station-connection-type'

export class UpdateStationRequest {
  @IsString()
  @IsNotEmpty({ message: 'Station name is required' })
  @MinLength(1)
  @MaxLength(50, { message: 'Station name cannot exceed 50 characters' })
  name: string

  @IsInt({ message: 'Display order must be an integer' })
  @Min(0, { message: 'Display order must be 0 or greater' })
  displayOrder: number

  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive: boolean

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (#RRGGBB)' })
  color?: string | null

  @IsOptional()
  @IsEnum(StationOutputDeviceEnum, { message: 'Output device must be one of: kds, printer, none' })
  outputDevice?: string

  @IsOptional()
  @IsString()
  printerAddress?: string | null

  @IsOptional()
  @IsEnum(StationConnectionTypeEnum, { message: 'Connection type must be one of: network, usb' })
  connectionType?: string

  @IsOptional()
  @IsString()
  usbIdentifier?: string | null
}
