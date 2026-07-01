/**
 * Session query (spec §5) — stub that owns the seam.
 *
 * Auth/staleness is TanStack Query's home turf; wiring `useSession` now against
 * the local stub means the future `remote/session` impl needs no component
 * changes. `staleTime: Infinity` reflects the fact that the local session never
 * changes during a run.
 */
import { queryOptions, useQuery } from '@tanstack/react-query'
import { useServices } from '@/services/context'
import type { Session, SessionService } from '@/services/types'
import { sessionKeys } from './keys'

/** Options factory for the current session. */
export function sessionOptions(session: SessionService) {
  return queryOptions({
    queryKey: sessionKeys.current(),
    queryFn: (): Promise<Session> => session.current(),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })
}

/** Query the current session (local stub: `{userId:'local', isAuthenticated:false}`). */
export function useSession() {
  const { session } = useServices()
  return useQuery(sessionOptions(session))
}
