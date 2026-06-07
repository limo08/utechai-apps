import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '../keys'
import { invalidateQueryTemplates } from './mutation-shared'

export const GLOBAL_ASSET_PROJECT_ID = 'global-asset-hub'

/**
 * Invalidate all global asset queries (unified key hierarchy).
 * The actual data queries use queryKeys.assets.list({ scope: 'global', ... })
 * which produces keys like ['global-assets', 'unified', folderId, kind].
 * We use queryKeys.assets.all('global') as the prefix to match all of them.
 */
function invalidateGlobalAssets(queryClient: QueryClient) {
  return invalidateQueryTemplates(queryClient, [queryKeys.assets.all('global')])
}

export function invalidateGlobalCharacters(queryClient: QueryClient) {
  return invalidateGlobalAssets(queryClient)
}

export function invalidateGlobalLocations(queryClient: QueryClient) {
  return invalidateGlobalAssets(queryClient)
}

export function invalidateGlobalVoices(queryClient: QueryClient) {
  return invalidateGlobalAssets(queryClient)
}
