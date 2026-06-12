import type { DataScope } from '@/types/rbac'

export const DATA_SCOPE_OPTIONS: { label: string; value: DataScope }[] = [
  { label: '仅本人', value: 'self' },
  { label: '本人及下属', value: 'subordinates' },
  { label: '本部门及子部门', value: 'department' },
  { label: '全部', value: 'all' },
]

/** 支持 owner_id 数据范围的 CRM 集合 */
export const OWNER_SCOPED_COLLECTIONS = new Set([
  'customers',
  'opportunities',
  'quotes',
  'contacts',
  'customer_follow_ups',
  'quote_items',
])

export function supportsDataScope(collection: string): boolean {
  return OWNER_SCOPED_COLLECTIONS.has(collection)
}
