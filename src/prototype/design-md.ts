import { parseDocument, stringify } from 'yaml'

export interface ParsedDesignMarkdown {
  readonly frontmatter: string | null
  readonly body: string
}

export type EditableDesignControlKind = 'color' | 'number' | 'text'

export interface EditableDesignControl {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly kind: EditableDesignControlKind
  readonly unit: string | null
  readonly min: number
  readonly max: number
  readonly source:
    | { readonly type: 'frontmatter'; readonly path: readonly string[] }
    | { readonly type: 'body-line'; readonly lineIndex: number }
}

export interface EditableDesignSection {
  readonly id: string
  readonly title: string
  readonly level: number
  readonly body: string
  readonly startLine: number
  readonly contentStartLine: number
  readonly endLine: number
}

export interface EditableDesignMarkdown {
  readonly frontmatter: Record<string, unknown> | null
  readonly frontmatterError: string | null
  readonly body: string
  readonly sections: readonly EditableDesignSection[]
  readonly controls: readonly EditableDesignControl[]
}

export function isDesignMarkdownFileName(name: string): boolean {
  const lower = name.trim().toLowerCase()
  return (
    lower === 'design.md' ||
    lower.endsWith('/design.md') ||
    lower.endsWith('.design.md') ||
    lower.endsWith('.md') ||
    lower.endsWith('.markdown')
  )
}

export function parseDesignMarkdown(content: string): ParsedDesignMarkdown {
  const text = content.replace(/^\uFEFF/, '')
  if (!text.startsWith('---\n')) return { frontmatter: null, body: text }

  const end = text.indexOf('\n---', 4)
  if (end < 0) return { frontmatter: null, body: text }

  const afterFence = text.slice(end + 4)
  const body = afterFence.startsWith('\n') ? afterFence.slice(1) : afterFence
  return {
    frontmatter: text.slice(4, end).trim(),
    body,
  }
}

export function normalizedDesignMarkdown(content: string): string {
  return content.replace(/^\uFEFF/, '').trim()
}

export function parseEditableDesignMarkdown(content: string): EditableDesignMarkdown {
  const parsed = parseDesignMarkdown(content)
  const frontmatterResult = parseFrontmatter(parsed.frontmatter)
  const sections = parseSections(parsed.body)
  return {
    frontmatter: frontmatterResult.value,
    frontmatterError: frontmatterResult.error,
    body: parsed.body,
    sections,
    controls: [
      ...frontmatterControls(frontmatterResult.value),
      ...bodyControls(parsed.body),
    ],
  }
}

export function updateDesignMarkdownControl(
  content: string,
  control: EditableDesignControl,
  nextValue: string,
): string {
  if (control.source.type === 'frontmatter') {
    return updateFrontmatterValue(content, control.source.path, nextValue)
  }
  return updateBodyLineValue(content, control.source.lineIndex, nextValue)
}

export function updateDesignMarkdownSection(
  content: string,
  section: EditableDesignSection,
  nextBody: string,
): string {
  const parsed = parseDesignMarkdown(content)
  const bodyLines = parsed.body.split('\n')
  const normalizedBody = nextBody.replace(/\r\n?/g, '\n')
  const replacement = normalizedBody.length > 0 ? normalizedBody.split('\n') : []
  bodyLines.splice(
    section.contentStartLine,
    Math.max(0, section.endLine - section.contentStartLine),
    ...replacement,
  )
  return composeDesignMarkdown(parsed.frontmatter, bodyLines.join('\n'))
}

export function appendDesignMarkdownSection(content: string): string {
  const parsed = parseDesignMarkdown(content)
  const body = parsed.body.trimEnd()
  const nextBody = `${body}${body ? '\n\n' : ''}## New section\nDescribe the design rule.`
  return composeDesignMarkdown(parsed.frontmatter, nextBody)
}

export function removeDesignMarkdownSection(
  content: string,
  section: EditableDesignSection,
): string {
  const parsed = parseDesignMarkdown(content)
  const bodyLines = parsed.body.split('\n')
  bodyLines.splice(section.startLine, Math.max(1, section.endLine - section.startLine))
  return composeDesignMarkdown(parsed.frontmatter, bodyLines.join('\n').replace(/^\n+/, '').trimEnd())
}

function parseFrontmatter(
  frontmatter: string | null,
): { readonly value: Record<string, unknown> | null; readonly error: string | null } {
  if (!frontmatter) return { value: null, error: null }
  try {
    const parsed = parseDocument(frontmatter).toJSON()
    if (!isRecord(parsed)) {
      return { value: null, error: 'Frontmatter is not an object.' }
    }
    return { value: parsed, error: null }
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function frontmatterControls(
  frontmatter: Record<string, unknown> | null,
): EditableDesignControl[] {
  if (!frontmatter) return []
  const controls: EditableDesignControl[] = []

  function visit(value: unknown, path: readonly string[]): void {
    if (path.length > 3) return
    if (isRecord(value)) {
      for (const [key, nested] of Object.entries(value)) {
        visit(nested, [...path, key])
      }
      return
    }
    if (Array.isArray(value)) return
    if (typeof value !== 'string' && typeof value !== 'number') return

    const rawValue = String(value)
    controls.push({
      id: `frontmatter:${path.join('.')}`,
      label: path.join('.'),
      value: rawValue,
      ...controlValueMeta(rawValue),
      source: { type: 'frontmatter', path },
    })
  }

  visit(frontmatter, [])
  return controls
}

function parseSections(body: string): EditableDesignSection[] {
  const lines = body.split('\n')
  const headings: Array<{ title: string; level: number; line: number }> = []
  lines.forEach((line, index) => {
    const match = /^(#{1,4})\s+(.+?)\s*$/.exec(line)
    if (!match) return
    headings.push({
      level: match[1].length,
      title: match[2].trim(),
      line: index,
    })
  })

  return headings.map((heading, index) => {
    const next = headings[index + 1]
    const endLine = next?.line ?? lines.length
    return {
      id: `section:${heading.line}:${slugify(heading.title)}`,
      title: heading.title,
      level: heading.level,
      startLine: heading.line,
      contentStartLine: heading.line + 1,
      endLine,
      body: lines.slice(heading.line + 1, endLine).join('\n').trim(),
    }
  })
}

function bodyControls(body: string): EditableDesignControl[] {
  return body
    .split('\n')
    .map((line, index): EditableDesignControl | null => {
      const match = /^(\s*(?:[-*]\s*)?)([^:\n]{2,48}):\s*(.+?)\s*$/.exec(line)
      if (!match) return null
      const label = match[2].trim()
      const value = match[3].trim()
      if (label.startsWith('http') || value.length > 120) return null
      return {
        id: `body-line:${index}:${slugify(label)}`,
        label,
        value,
        ...controlValueMeta(value),
        source: { type: 'body-line', lineIndex: index },
      }
    })
    .filter((control): control is EditableDesignControl => Boolean(control))
}

function controlValueMeta(value: string): Omit<EditableDesignControl, 'id' | 'label' | 'value' | 'source'> {
  const color = /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?/i.exec(value)
  if (color) {
    return { kind: 'color', unit: null, min: 0, max: 100 }
  }

  const numeric = /^-?\d+(?:\.\d+)?\s*(px|%|rem|em|vh|vw|s|ms)?$/i.exec(value.trim())
  if (numeric) {
    const amount = Number.parseFloat(value)
    const unit = numeric[1] ?? null
    return {
      kind: 'number',
      unit,
      min: unit === '%' ? 0 : 0,
      max: unit === '%' ? 100 : Math.max(100, Math.ceil(amount * 2 || 100)),
    }
  }

  return { kind: 'text', unit: null, min: 0, max: 100 }
}

function updateFrontmatterValue(
  content: string,
  path: readonly string[],
  nextValue: string,
): string {
  const parsed = parseDesignMarkdown(content)
  const current = parseFrontmatter(parsed.frontmatter).value ?? {}
  const next = cloneRecord(current)
  setAtPath(next, path, coerceValue(nextValue, getAtPath(current, path)))
  return composeDesignMarkdown(stringify(next).trimEnd(), parsed.body)
}

function updateBodyLineValue(
  content: string,
  lineIndex: number,
  nextValue: string,
): string {
  const parsed = parseDesignMarkdown(content)
  const bodyLines = parsed.body.split('\n')
  const line = bodyLines[lineIndex]
  if (!line) return content
  const match = /^(\s*(?:[-*]\s*)?[^:\n]{2,48}:\s*)(.+?)\s*$/.exec(line)
  if (!match) return content
  bodyLines[lineIndex] = `${match[1]}${nextValue}`
  return composeDesignMarkdown(parsed.frontmatter, bodyLines.join('\n'))
}

function composeDesignMarkdown(frontmatter: string | null, body: string): string {
  const normalizedBody = body.replace(/^\n+/, '')
  if (!frontmatter) return normalizedBody
  return `---\n${frontmatter.trim()}\n---\n${normalizedBody}`
}

function getAtPath(record: Record<string, unknown>, path: readonly string[]): unknown {
  let current: unknown = record
  for (const key of path) {
    if (!isRecord(current)) return undefined
    current = current[key]
  }
  return current
}

function setAtPath(record: Record<string, unknown>, path: readonly string[], value: unknown): void {
  let current: Record<string, unknown> = record
  path.slice(0, -1).forEach((key) => {
    if (!isRecord(current[key])) current[key] = {}
    current = current[key] as Record<string, unknown>
  })
  const key = path.at(-1)
  if (key) current[key] = value
}

function coerceValue(value: string, previous: unknown): unknown {
  if (typeof previous === 'number') {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : previous
  }
  return value
}

function cloneRecord(record: Record<string, unknown>): Record<string, unknown> {
  return structuredClone(record) as Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}
