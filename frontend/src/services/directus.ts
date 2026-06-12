import {
  authentication,
  createDirectus,
  rest,
} from '@directus/sdk'
import { authStorage } from '@/services/auth-storage'
import type { DirectusSchema } from '@/types/directus'

function resolveDirectusUrl(): string {
  const apiBase = import.meta.env.VITE_API_BASE || '/api'

  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    return apiBase
  }

  return new URL(apiBase, window.location.origin).href
}

export const directus = createDirectus<DirectusSchema>(resolveDirectusUrl())
  .with(
    authentication('json', {
      storage: authStorage,
      autoRefresh: true,
    }),
  )
  .with(rest())
