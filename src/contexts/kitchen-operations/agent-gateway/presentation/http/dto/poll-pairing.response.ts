export type PollPairingResponse =
  | { status: 'pending' }
  | { status: 'ready'; apiKey: string }
  | { status: 'delivered' }
