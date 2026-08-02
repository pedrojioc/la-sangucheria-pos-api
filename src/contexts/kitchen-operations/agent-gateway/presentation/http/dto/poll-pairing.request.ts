import { IsString, Length, Matches } from 'class-validator'
import { PAIRING_CODE_ALPHABET } from '@contexts/kitchen-operations/pairing-code/domain/pairing-code'

export class PollPairingRequest {
  @Length(6, 6)
  @Matches(new RegExp(`^[${PAIRING_CODE_ALPHABET}]+$`), {
    message: 'code must contain only characters from the pairing code alphabet'
  })
  code: string

  @IsString()
  pollToken: string
}
