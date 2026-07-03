import { describe, it, expect, vi } from 'vitest'
import { recognizeIntent } from './intent'
import { intentProfileSchema } from './intent-types'
import { ok, err, isErr, type Result } from '@/services/types'
import type { GenerateInput, GenerationService } from '@/services/ai/types'

/** The structured-output shape the intent call resolves. */
type IntentResult = Result<unknown>

/** A typed stand-in for `generateObject` so `.mock.calls` keeps its arg types. */
type GenObjectFn = (input: GenerateInput, schema: unknown) => Promise<IntentResult>

/** A GenerationService whose only exercised method is `generateObject`. */
function fakeGeneration(generateObject: unknown): GenerationService {
  return {
    generateText: vi.fn(),
    streamText: vi.fn(),
    generateImages: vi.fn(),
    editImage: vi.fn(),
    generateObject,
  } as unknown as GenerationService
}

/** A confident, self-derived profile with no clarifying questions. */
const confidentProfile = {
  goal: 'A mobile marketplace for cartoon figurine collectibles',
  strategy: 'catalog-first collectibles storefront',
  rationale: 'The brief centers on browsing + buying stylized figures.',
  dimensions: [
    { aspect: 'domain', value: 'e-commerce / collectibles' },
    { aspect: 'audience', value: 'anime + figure hobbyists' },
  ],
  assumptions: ['Consumer-facing, not a wholesale portal'],
  confidence: 0.86,
  questions: [],
}

describe('recognizeIntent', () => {
  it('rejects an empty brief without calling the model', async () => {
    const generateObject = vi.fn<GenObjectFn>()
    const gen = fakeGeneration(generateObject)
    const result = await recognizeIntent(gen, { providerId: 'p', model: 'm', brief: '  ' })
    expect(result.ok).toBe(false)
    expect(generateObject).not.toHaveBeenCalled()
  })

  it('recognizes a high-confidence intent on the chat slot and returns it', async () => {
    const generateObject = vi.fn<GenObjectFn>().mockResolvedValue(ok(confidentProfile))
    const gen = fakeGeneration(generateObject)
    const result = await recognizeIntent(gen, {
      providerId: 'chat',
      model: 'gpt-5.5',
      brief: '卡通手办商城',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.strategy).toBe('catalog-first collectibles storefront')
    expect(result.data.confidence).toBeGreaterThan(0.5)
    expect(result.data.questions).toEqual([])

    // The call carries the intent promptRef + the brief as a text part.
    const [input, schema] = generateObject.mock.calls[0]
    expect(input.promptRef).toEqual({ id: 'ui-intent-recognition' })
    expect(input.model).toBe('gpt-5.5')
    expect(input.input?.[0]).toEqual({ type: 'text', text: '卡通手办商城' })
    expect(schema).toBe(intentProfileSchema)
  })

  it('surfaces clarifying questions on a low-confidence profile', async () => {
    const uncertain = {
      goal: 'Something involving figurines — scope unclear',
      strategy: 'clarify-before-committing',
      rationale: 'The brief is too terse to infer surfaces or audience.',
      dimensions: [{ aspect: 'domain', value: 'possibly collectibles' }],
      assumptions: [],
      confidence: 0.3,
      questions: ['Is this a storefront, a showcase, or a fan community?'],
    }
    const generateObject = vi.fn<GenObjectFn>().mockResolvedValue(ok(uncertain))
    const gen = fakeGeneration(generateObject)
    const result = await recognizeIntent(gen, { providerId: 'p', model: 'm', brief: '手办' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.confidence).toBeLessThan(0.5)
    expect(result.data.questions).toHaveLength(1)
  })

  it('propagates a generation failure', async () => {
    const generateObject = vi.fn<GenObjectFn>().mockResolvedValue(err('boom'))
    const gen = fakeGeneration(generateObject)
    const result = await recognizeIntent(gen, { providerId: 'p', model: 'm', brief: 'x' })
    expect(result).toEqual(err('boom'))
  })

  it('rejects a structurally invalid profile from the model', async () => {
    const invalid = { goal: 'x', strategy: 'y', rationale: 'z', confidence: 5 }
    const generateObject = vi.fn<GenObjectFn>().mockResolvedValue(ok(invalid))
    const gen = fakeGeneration(generateObject)
    const result = await recognizeIntent(gen, { providerId: 'p', model: 'm', brief: 'x' })
    expect(result.ok).toBe(false)
    if (!isErr(result)) return
    expect(result.error).toContain('invalid intent profile')
  })
})
