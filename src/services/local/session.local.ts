/**
 * Local session stub (spec §5).
 *
 * v1 is offline-first with no accounts: everyone is the anonymous local user.
 * `signIn` / `signOut` are intentionally absent (optional on the interface) so
 * the future `remote/session` impl is a pure add, not a change.
 */
import type { Session, SessionService } from '@/services/types'

const LOCAL_SESSION: Session = { userId: 'local', isAuthenticated: false }

export function createLocalSessionService(): SessionService {
  return {
    current: async () => LOCAL_SESSION,
  }
}
