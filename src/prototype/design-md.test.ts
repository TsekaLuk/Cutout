import { describe, expect, it } from 'vitest'
import {
  isDesignMarkdownFileName,
  normalizedDesignMarkdown,
  parseEditableDesignMarkdown,
  parseDesignMarkdown,
  appendDesignMarkdownSection,
  removeDesignMarkdownSection,
  updateDesignMarkdownControl,
  updateDesignMarkdownSection,
} from './design-md'

describe('DESIGN.md helpers', () => {
  it('recognizes DESIGN.md ecosystem filenames', () => {
    expect(isDesignMarkdownFileName('DESIGN.md')).toBe(true)
    expect(isDesignMarkdownFileName('brand.design.md')).toBe(true)
    expect(isDesignMarkdownFileName('notes.markdown')).toBe(true)
    expect(isDesignMarkdownFileName('mockup.png')).toBe(false)
  })

  it('parses optional YAML frontmatter and markdown body', () => {
    const parsed = parseDesignMarkdown('---\nversion: alpha\nname: Demo\n---\n# Demo\nUse blue.')

    expect(parsed.frontmatter).toContain('version: alpha')
    expect(parsed.body).toBe('# Demo\nUse blue.')
  })

  it('normalizes BOM and surrounding whitespace', () => {
    expect(normalizedDesignMarkdown('\uFEFF  # Design\n')).toBe('# Design')
  })

  it('extracts editable frontmatter, body controls, and sections', () => {
    const parsed = parseEditableDesignMarkdown([
      '---',
      'product: Demo',
      'spacing:',
      '  section: 64px',
      'colors:',
      '  primary: "#2463EB"',
      '---',
      '# Overview',
      'radius: 12px',
      'Use the primary surface.',
    ].join('\n'))

    expect(parsed.frontmatter?.product).toBe('Demo')
    expect(parsed.sections[0]?.title).toBe('Overview')
    expect(parsed.controls.some((control) => control.id === 'frontmatter:colors.primary')).toBe(true)
    expect(parsed.controls.some((control) => control.id.startsWith('body-line:'))).toBe(true)
  })

  it('updates one frontmatter control while preserving the markdown body', () => {
    const content = [
      '---',
      'spacing:',
      '  section: 64px',
      '---',
      '# Overview',
      'Use space.',
    ].join('\n')
    const control = parseEditableDesignMarkdown(content).controls.find(
      (item) => item.id === 'frontmatter:spacing.section',
    )

    expect(control).toBeTruthy()
    const updated = updateDesignMarkdownControl(content, control!, '80px')

    expect(updated).toContain('section: 80px')
    expect(updated).toContain('# Overview')
  })

  it('updates markdown section bodies', () => {
    const content = '# Overview\nOld copy.\n# Components\nButtons.'
    const section = parseEditableDesignMarkdown(content).sections[0]

    expect(section).toBeTruthy()
    const updated = updateDesignMarkdownSection(content, section!, 'New copy.')

    expect(updated).toBe('# Overview\nNew copy.\n# Components\nButtons.')
  })

  it('appends and removes markdown sections', () => {
    const added = appendDesignMarkdownSection('# Overview\nCopy.')
    expect(added).toContain('## New section')

    const newSection = parseEditableDesignMarkdown(added).sections.find(
      (section) => section.title === 'New section',
    )
    expect(newSection).toBeTruthy()
    expect(removeDesignMarkdownSection(added, newSection!)).toBe('# Overview\nCopy.')
  })
})
