/**
 * Asset library queries (spec §5) — stubs that prove the seam.
 *
 * v1's local repository returns an empty list, but shaping these queries now
 * (exact keys, `gcTime`, `queryFn` using the injected service) means a future
 * cloud library is a service swap, not new query code. `useExportAll` already
 * invalidates `assetKeys.all`, so the list refreshes for free once it is real.
 */
import { queryOptions, useQuery } from '@tanstack/react-query'
import { useServices } from '@/services/context'
import type { AssetListFilter, AssetRef, AssetRepository } from '@/services/types'
import { isErr } from '@/services/types'
import { assetKeys } from './keys'

/** Options factory for the asset list (reused by prefetch + `useQuery`). */
export function assetsListOptions(
  assets: AssetRepository,
  filter?: AssetListFilter,
) {
  return queryOptions({
    queryKey: assetKeys.list(filter),
    queryFn: async (): Promise<AssetRef[]> => {
      const result = await assets.list(filter)
      if (isErr(result)) throw new Error(result.error)
      return result.data
    },
    gcTime: 5 * 60_000,
  })
}

/** Query the asset library list (empty in v1). */
export function useAssets(filter?: AssetListFilter) {
  const { assets } = useServices()
  return useQuery(assetsListOptions(assets, filter))
}

/** Load a single asset blob by id (stubbed; errors in v1). */
export function useAsset(id: string) {
  const { assets } = useServices()
  return useQuery(
    queryOptions({
      queryKey: assetKeys.one(id),
      queryFn: async (): Promise<Blob> => {
        const result = await assets.load(id)
        if (isErr(result)) throw new Error(result.error)
        return result.data
      },
      enabled: id.length > 0,
      gcTime: 5 * 60_000,
    }),
  )
}
