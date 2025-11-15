/**
 * Cloudflare Images API Response Types
 *
 * These types represent the structure of responses from the Cloudflare Images API.
 * They are infrastructure-specific and should NOT be exposed to the domain layer.
 *
 * Reference: https://developers.cloudflare.com/api/operations/cloudflare-images-upload-an-image-via-url
 */

export interface CloudflareImagesUploadResponse {
  success: boolean
  result: {
    id: string // Image unique identifier
    filename: string
    uploaded: string // ISO 8601 timestamp
    requireSignedURLs: boolean
    variants: string[] // Array of variant URLs
  }
  errors: Array<{
    code: number
    message: string
  }>
  messages: string[]
}

export interface CloudflareImagesDeleteResponse {
  success: boolean
  result: unknown | string
  errors: Array<{
    code: number
    message: string
  }>
  messages: string[]
}

export interface CloudflareImagesErrorResponse {
  success: false
  errors: Array<{
    code: number
    message: string
  }>
  messages: string[]
}
