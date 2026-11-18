// "8 GB di RAM", "16 GB RAM", "4096 MB RAM" → size in GB, or null when the text gives none.
export function sizeInGb(text: string): number | null {
  const match = /(\d+(?:[.,]\d+)?)\s*(TB|GB|MB)/i.exec(text)
  if (!match) return null
  const n = Number(match[1].replace(',', '.'))
  const unit = match[2].toUpperCase()
  return unit === 'TB' ? n * 1024 : unit === 'MB' ? n / 1024 : n
}
