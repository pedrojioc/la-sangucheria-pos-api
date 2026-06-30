import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator'

export class MoveFloorElementRequest {
  @IsNumber({}, { message: 'positionX debe ser un número' })
  @Min(0)
  @Max(100)
  positionX: number

  @IsNumber({}, { message: 'positionY debe ser un número' })
  @Min(0)
  @Max(100)
  positionY: number

  @IsInt()
  @Min(0)
  @Max(359)
  @IsOptional()
  rotation?: number
}
