import type { RequirementKind, RequirementRow } from '@shared/types/steam'
export { sizeInGb } from '@shared/units'

// Steam's pc_requirements.minimum is an HTML list such as
// <strong>Minimi:</strong><br><ul><li><strong>Memoria:</strong> 8 GB di RAM</li>…</ul>
// It is turned into plain text here, in the main process, so the renderer never
// receives Steam's HTML.

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  reg: '®',
  trade: '™',
  copy: '©'
}

function toText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      if (code[0] === '#') {
        const n =
          code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : Number(code.slice(1))
        return Number.isSafeInteger(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : ''
      }
      return ENTITIES[code.toLowerCase()] ?? entity
    })
    .replace(/\s+/g, ' ')
    .trim()
}

// Steam's own labels, in the languages the API may ask for.
const KINDS: [RequirementKind, RegExp][] = [
  ['os', /^(sistema operativo|os|operating system)/i],
  ['cpu', /^(processore|processor|cpu)/i],
  ['ram', /^(memoria|memory|ram)/i],
  ['gpu', /^(scheda video|scheda grafica|graphics|video card|gpu)/i],
  ['storage', /^(archiviazione|spazio su disco|storage|hard drive|hard disk)/i],
  ['directx', /^directx/i]
]

function kindOf(label: string): RequirementKind {
  return KINDS.find(([, pattern]) => pattern.test(label))?.[0] ?? 'other'
}

export function parseRequirements(html: unknown): RequirementRow[] {
  if (typeof html !== 'string' || !html) return []
  const items = html.match(/<li[^>]*>[\s\S]*?(?=<li|<\/ul|$)/gi) ?? [html]
  const rows: RequirementRow[] = []
  for (const item of items) {
    const labelled = /^\s*<li[^>]*>\s*<strong>([\s\S]*?)<\/strong>([\s\S]*)$/i.exec(item)
    const label = labelled ? toText(labelled[1]).replace(/:$/, '').trim() : ''
    // Drop the "Minimi:" heading Steam puts before the list (or before plain text).
    const value = toText(labelled ? labelled[2] : item).replace(
      /^(requisiti minimi|minimi|minimum)\s*:\s*/i,
      ''
    )
    if (!value) continue
    rows.push({ kind: label ? kindOf(label) : 'other', label, value: value.slice(0, 500) })
  }
  return rows.slice(0, 20)
}
