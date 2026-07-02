/**
 * In-code prompt registry (spec §3/§7) — the built-in catalog.
 *
 * A `Map<id, PromptVersion[]>` holding every shipped version of every prompt.
 * `resolve(id, version?)` applies "pinned version, else latest semver"; old
 * versions are never dropped (rollback / attribution / eval). Semver is compared
 * inline — no dependency — since versions are authored `x.y.z` strings.
 *
 * The registry is a small stateful accumulator (a catalog builder), so
 * `register` extends its internal map; the *data* it returns to callers is
 * always fresh, read-only, and never a live reference to internal arrays.
 */
import type { PromptSummary, PromptVersion } from './types'

/** Thrown when an id has no registered versions. */
export class UnknownPromptError extends Error {
  constructor(id: string) {
    super(`unknown prompt: ${id}`)
    this.name = 'UnknownPromptError'
  }
}

/** Thrown when a pinned version does not exist for an otherwise-known id. */
export class UnknownPromptVersionError extends Error {
  constructor(id: string, version: string) {
    super(`unknown prompt version: ${id}@${version}`)
    this.name = 'UnknownPromptVersionError'
  }
}

/** Thrown when a version string is not a strict `major.minor.patch`. */
export class InvalidSemverError extends Error {
  constructor(value: string) {
    super(`invalid semver: ${value}`)
    this.name = 'InvalidSemverError'
  }
}

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/

/** Parse `x.y.z` → tuple; throws {@link InvalidSemverError} on malformed input. */
function parseSemver(value: string): readonly [number, number, number] {
  const match = SEMVER.exec(value)
  if (!match) throw new InvalidSemverError(value)
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

/** Compare two semver strings: negative if a<b, positive if a>b, 0 if equal. */
export function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a)
  const pb = parseSemver(b)
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i]
  }
  return 0
}

/** Return a copy of `versions` sorted ascending by semver. */
function sortedAscending(
  versions: readonly PromptVersion[],
): readonly PromptVersion[] {
  return [...versions].sort((x, y) => compareSemver(x.version, y.version))
}

export interface PromptRegistry {
  /** Add definitions to the catalog (merged per id, re-sorted by semver). */
  register(defs: readonly PromptVersion[]): void
  /** Resolve a version: pinned if `version` given, else the highest semver. */
  resolve(id: string, version?: string): PromptVersion
  /** All versions of an id, ascending semver. Throws on unknown id. */
  versions(id: string): readonly string[]
  /** One summary per id at its latest version. */
  list(): readonly PromptSummary[]
}

/** Build an empty registry. Callers register built-ins (see `catalog/`). */
export function createPromptRegistry(): PromptRegistry {
  const byId = new Map<string, readonly PromptVersion[]>()

  function all(id: string): readonly PromptVersion[] {
    const versions = byId.get(id)
    if (!versions || versions.length === 0) throw new UnknownPromptError(id)
    return versions
  }

  return {
    register(defs) {
      for (const def of defs) {
        const existing = byId.get(def.id) ?? []
        // Replace any same-version entry so re-registration is idempotent, then
        // keep the array sorted so "latest" is always the last element.
        const merged = [
          ...existing.filter((d) => d.version !== def.version),
          def,
        ]
        byId.set(def.id, sortedAscending(merged))
      }
    },

    resolve(id, version) {
      const versions = all(id)
      if (version === undefined) return versions[versions.length - 1]
      const hit = versions.find((d) => d.version === version)
      if (!hit) throw new UnknownPromptVersionError(id, version)
      return hit
    },

    versions(id) {
      return all(id).map((d) => d.version)
    },

    list() {
      return [...byId.values()].map((versions) => {
        const latest = versions[versions.length - 1]
        return {
          id: latest.id,
          version: latest.version,
          scenario: latest.scenario,
          description: latest.description,
          modality: latest.hints.modality,
        }
      })
    },
  }
}
