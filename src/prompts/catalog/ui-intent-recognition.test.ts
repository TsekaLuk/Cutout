import { describe, it, expect } from 'vitest'
import { createBuiltinRegistry } from './index'
import { uiIntentRecognition } from './ui-intent-recognition'
import { createLocalPromptService } from '@/services/ai/prompt-service.local'
import { render } from '../render'

describe('ui-intent-recognition v1.0.0', () => {
  it('carries the expected id, version, scenario and hints', () => {
    expect(uiIntentRecognition.id).toBe('ui-intent-recognition')
    expect(uiIntentRecognition.version).toBe('1.0.0')
    expect(uiIntentRecognition.scenario).toBe('intent')
    expect(uiIntentRecognition.hints).toEqual({
      modality: 'text',
      temperature: 0.3,
    })
  })

  it('renders the verbatim system instruction (open-world, self-derived)', () => {
    const out = render(uiIntentRecognition, {})
    expect(out.system).toContain('Intent Analyst')
    // Reconstructs + mines the true intent along self-chosen aspects.
    expect(out.system).toContain('RECONSTRUCT')
    expect(out.system).toContain('MINE')
    // Open-world: strategy + aspects are self-authored, never a fixed list.
    expect(out.system).toContain('NO fixed menu')
    expect(out.system).toContain('NEVER selected from a fixed list')
    // Questions only when genuinely uncertain — not an interrogation.
    expect(out.system).toContain('ONLY when genuinely uncertain')
    // Emits the IntentProfile shape.
    expect(out.system).toContain('"confidence"')
    // v1 has no template variables.
    expect(out.userScaffold).toBeUndefined()
  })

  it('is discoverable through the built-in registry as latest', () => {
    const registry = createBuiltinRegistry()
    expect(registry.resolve('ui-intent-recognition').version).toBe('1.0.0')
    const summaries = registry.list()
    expect(summaries.some((s) => s.id === 'ui-intent-recognition')).toBe(true)
  })

  it('resolves + renders through the local PromptService', async () => {
    const service = createLocalPromptService()
    const rendered = await service.render({ id: 'ui-intent-recognition' })
    expect(rendered.system).toContain('Intent Analyst')

    const versions = await service.versions('ui-intent-recognition')
    expect(versions).toEqual(['1.0.0'])
  })
})
