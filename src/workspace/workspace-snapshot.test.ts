import { describe, expect, it } from 'vitest'
import { textFingerprint } from './workspace-snapshot'

describe('workspace snapshot helpers', () => {
  it('fingerprints same-length text changes', () => {
    expect(textFingerprint('16px')).not.toBe(textFingerprint('18px'))
  })
})
