import { IsOptional, IsString } from 'class-validator'
import { CriteriaRequest } from '@/shared/presentation/dto/criteria.request'

export class SearchCustomersRequest extends CriteriaRequest {
  @IsString()
  @IsOptional()
  phone?: string
}
