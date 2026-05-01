export const DOCUMENT_TYPES = ['CC', 'NIT', 'CE', 'PASAPORTE', 'NIT_EXTRANJERO'] as const
export type DocumentTypeValue = (typeof DOCUMENT_TYPES)[number]
