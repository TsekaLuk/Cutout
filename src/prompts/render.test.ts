import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { ZodError } from 'zod'
import { render } from './render'
import type { PromptVersion } from './types'

const greeting: PromptVersion<z.ZodObject<{ name: z.ZodString }>> = {
  id: 'greeting',
  version: '1.0.0',
  description: 'greet by name',
  scenario: 'generation',
  hints: { modality: 'text' },
  inputSchema: z.object({ name: z.string().min(1) }),
  render: (vars) => ({ system: `Hello, ${vars.name}.` }),
}

describe('render', () => {
  it('validates vars then renders the system instruction', () => {
    const out = render(greeting, { name: 'Ada' })
    expect(out.system).toBe('Hello, Ada.')
  })

  it('throws ZodError when variables are invalid', () => {
    expect(() => render(greeting, { name: '' })).toThrow(ZodError)
    expect(() => render(greeting, {})).toThrow(ZodError)
  })

  it('is deterministic and does not mutate its input', () => {
    const vars = Object.freeze({ name: 'Ada' })
    const a = render(greeting, vars)
    const b = render(greeting, vars)
    expect(a).toEqual(b)
  })

  it('defaults missing vars to an empty object for no-variable prompts', () => {
    const noVars: PromptVersion = {
      ...greeting,
      inputSchema: z.object({}),
      render: () => ({ system: 'static' }),
    }
    expect(render(noVars, undefined).system).toBe('static')
  })
})
