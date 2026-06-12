import { readCollections } from '@directus/sdk'
import { directus } from '@/services/directus'
import type { CollectionMeta } from '@/types/rbac'

const SYSTEM_PREFIX = 'directus_'

export async function listManageableCollections(): Promise<CollectionMeta[]> {
  const collections = await directus.request(readCollections())

  return collections
    .filter((item) => {
      const name = item.collection
      if (name.startsWith(SYSTEM_PREFIX)) return false
      return item.meta?.hidden !== true
    })
    .map((item) => ({
      collection: item.collection,
      label: item.meta?.note || item.collection,
    }))
    .sort((a, b) => a.collection.localeCompare(b.collection))
}
