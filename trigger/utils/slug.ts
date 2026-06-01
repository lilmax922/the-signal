function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toDate(value: string | Date): Date {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`Invalid publishedAt date: ${String(value)}`)
  }
  return date
}

export function generateSlug(title: string, publishedAt: string | Date): string {
  const date = toDate(publishedAt)
  const yyyymmdd
    = date.getUTCFullYear().toString()
      + String(date.getUTCMonth() + 1).padStart(2, '0')
      + String(date.getUTCDate()).padStart(2, '0')

  const base = slugify(title)
  return base ? `${base}-${yyyymmdd}` : yyyymmdd
}
