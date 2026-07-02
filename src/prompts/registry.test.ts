import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  compareSemver,
  createPromptRegistry,
  InvalidSemverError,
  UnknownPromptError,
  UnknownPromptVersionError,
} from './registry'
import type { PromptVersion } from './types'

/** Minimal version factory for registry tests. */
function makeVersion(id: string, version: string): PromptVersion {
  return {
    id,
    version,
    description: `${id}@${version}`,
    scenario: 'generation',
    hints: { modality: 'text' },
    inputSchema: z.object({}),
    render: () => ({ system: `system for ${version}` }),
  }
}

describe('compareSemver', () => {
  it('orders by major, then minor, then patch', () => {
    expect(compareSemver('1.0.0', '2.0.0')).toBeLessThan(0)
    expect(compareSemver('1.2.0', '1.1.9')).toBeGreaterThan(0)
    expect(compareSemver('1.0.10', '1.0.2')).toBeGreaterThan(0)
    expect(compareSemver('3.4.5', '3.4.5')).toBe(0)
  })

  it('throws on malformed versions', () => {
    expect(() => compareSemver('1.0', '1.0.0')).toThrow(InvalidSemverError)
    expect(() => compareSemver('v1.0.0', '1.0.0')).toThrow(InvalidSemverError)
  })
})

describe('PromptRegistry.resolve', () => {
  it('resolves the highest semver when no version is pinned', () => {
    const registry = createPromptRegistry()
    // Register out of order to prove sorting, not insertion order.
    registry.register([
      makeVersion('p', '1.0.0'),
      makeVersion('p', '2.1.0'),
      makeVersion('p', '1.2.0'),
    ])
    expect(registry.resolve('p').version).toBe('2.1.0')
  })

  it('resolves a pinned version exactly', () => {
    const registry = createPromptRegistry()
    registry.register([makeVersion('p', '1.0.0'), makeVersion('p', '2.0.0')])
    expect(registry.resolve('p', '1.0.0').version).toBe('1.0.0')
  })

  it('throws UnknownPromptError for an unknown id', () => {
    const registry = createPromptRegistry()
    expect(() => registry.resolve('missing')).toThrow(UnknownPromptError)
  })

  it('throws UnknownPromptVersionError for an unknown pinned version', () => {
    const registry = createPromptRegistry()
    registry.register([makeVersion('p', '1.0.0')])
    expect(() => registry.resolve('p', '9.9.9')).toThrow(
      UnknownPromptVersionError,
    )
  })

  it('is idempotent when the same version is re-registered', () => {
    const registry = createPromptRegistry()
    registry.register([makeVersion('p', '1.0.0')])
    registry.register([makeVersion('p', '1.0.0')])
    expect(registry.versions('p')).toEqual(['1.0.0'])
  })
})

describe('PromptRegistry.versions / list', () => {
  it('returns versions ascending', () => {
    const registry = createPromptRegistry()
    registry.register([
      makeVersion('p', '2.0.0'),
      makeVersion('p', '1.0.0'),
      makeVersion('p', '1.5.0'),
    ])
    expect(registry.versions('p')).toEqual(['1.0.0', '1.5.0', '2.0.0'])
  })

  it('throws on versions() for an unknown id', () => {
    const registry = createPromptRegistry()
    expect(() => registry.versions('missing')).toThrow(UnknownPromptError)
  })

  it('lists one summary per id at its latest version', () => {
    const registry = createPromptRegistry()
    registry.register([
      makeVersion('a', '1.0.0'),
      makeVersion('a', '1.1.0'),
      makeVersion('b', '3.0.0'),
    ])
    const summaries = registry.list()
    const byId = Object.fromEntries(summaries.map((s) => [s.id, s.version]))
    expect(byId).toEqual({ a: '1.1.0', b: '3.0.0' })
  })
})
