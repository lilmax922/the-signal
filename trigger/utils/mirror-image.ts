import { randomUUID } from 'node:crypto'
import { logger } from '@trigger.dev/sdk'
import sharp from 'sharp'
import { fetch as undiciFetch } from 'undici'
import { createStorageClient } from '../../shared/utils/create-storage-client'

const BUCKET = 'signal-images'
const USER_AGENT
  = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const TARGET_WIDTH = 1280
const SOFT_TARGET_BYTES = 95 * 1024
const QUALITY_PRIMARY = 80
const QUALITY_FALLBACK = 65

type CompressedImage = {
  body: Uint8Array
  contentType: string
  ext: string
  inputBytes: number
  outputBytes: number
  quality: number
}

async function compressWebp(input: Uint8Array): Promise<CompressedImage> {
  const base = sharp(input, { failOn: 'none' })
    .rotate()
    .resize({ width: TARGET_WIDTH, withoutEnlargement: true })

  const primary = await base
    .clone()
    .webp({ quality: QUALITY_PRIMARY })
    .toBuffer({ resolveWithObject: true })

  const primaryResult: CompressedImage = {
    body: new Uint8Array(primary.data),
    contentType: 'image/webp',
    ext: 'webp',
    inputBytes: input.byteLength,
    outputBytes: primary.data.byteLength,
    quality: QUALITY_PRIMARY,
  }

  if (primaryResult.outputBytes <= SOFT_TARGET_BYTES) {
    return primaryResult
  }

  const fallback = await base
    .clone()
    .webp({ quality: QUALITY_FALLBACK })
    .toBuffer({ resolveWithObject: true })

  const fallbackResult: CompressedImage = {
    body: new Uint8Array(fallback.data),
    contentType: 'image/webp',
    ext: 'webp',
    inputBytes: input.byteLength,
    outputBytes: fallback.data.byteLength,
    quality: QUALITY_FALLBACK,
  }

  return fallbackResult.outputBytes < primaryResult.outputBytes ? fallbackResult : primaryResult
}

export async function mirrorImage(imageUrl: string): Promise<string> {
  const response = await undiciFetch(imageUrl, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status} ${imageUrl}`)
  }

  const originalContentType = response.headers.get('content-type') ?? 'image/jpeg'
  const originalExt = originalContentType.split('/')[1]?.split(';')[0]?.trim() || 'jpg'
  const arrayBuffer = await response.arrayBuffer()
  const original = new Uint8Array(arrayBuffer)

  let body: Uint8Array
  let contentType: string
  let ext: string
  let inputBytes: number
  let outputBytes: number
  let quality: number | null = null

  try {
    const compressed = await compressWebp(original)
    body = compressed.body
    contentType = compressed.contentType
    ext = compressed.ext
    inputBytes = compressed.inputBytes
    outputBytes = compressed.outputBytes
    quality = compressed.quality
  }
  catch (err) {
    logger.warn('Image compression failed, uploading original', { imageUrl, err })
    body = original
    contentType = originalContentType
    ext = originalExt
    inputBytes = original.byteLength
    outputBytes = original.byteLength
  }

  const filename = `${randomUUID()}.${ext}`
  const supabase = createStorageClient()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, body, { contentType, upsert: true })

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)

  if (!data.publicUrl) {
    throw new Error('Image upload succeeded but no public URL was returned')
  }

  logger.info('Image mirrored', {
    imageUrl,
    publicUrl: data.publicUrl,
    inputBytes,
    outputBytes,
    quality,
    contentType,
  })

  return data.publicUrl
}
