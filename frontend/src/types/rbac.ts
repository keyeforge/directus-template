export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'share'

export type DataScope = 'self' | 'subordinates' | 'department' | 'all'

export type PermissionAccess = 'none' | 'partial' | 'full'

export interface PolicyGlobals {
  admin_access: boolean
  app_access: boolean
  enforce_tfa: boolean
}

export interface CollectionPermission {
  access: PermissionAccess
  fields?: string[]
  presets?: Record<string, unknown>
}

export type UserPermissions = Record<
  string,
  Partial<Record<PermissionAction, CollectionPermission>>
>

export interface RolePolicyLink {
  id: string
  policy?: string | PolicySummary | null
}

export interface RoleRecord {
  id: string
  name: string
  icon?: string | null
  description?: string | null
  parent?: string | RoleSummary | null
  policies?: RolePolicyLink[] | null
  users?: { id: string }[] | null
}

export interface RoleSummary {
  id: string
  name: string
}

export interface RoleInput {
  name: string
  icon?: string | null
  description?: string | null
  parent?: string | null
  policyIds?: string[]
}

export interface PolicyRecord {
  id: string
  name: string
  icon?: string | null
  description?: string | null
  ip_access?: string | null
  enforce_tfa?: boolean
  admin_access?: boolean
  app_access?: boolean
  permissions?: PermissionRecord[] | number[] | null
}

export interface PolicySummary {
  id: string
  name: string
}

export interface PolicyInput {
  name: string
  icon?: string | null
  description?: string | null
  ip_access?: string | null
  enforce_tfa?: boolean
  admin_access?: boolean
  app_access?: boolean
}

export interface PermissionRecord {
  id: number
  policy?: string | PolicySummary | null
  collection: string
  action: PermissionAction | string
  permissions?: Record<string, unknown> | null
  validation?: Record<string, unknown> | null
  presets?: Record<string, unknown> | null
  fields?: string[] | null
}

export interface PolicyDataScopeRecord {
  id: number
  policy_id: string
  collection: string
  scope: DataScope
}

export interface PermissionMatrixRow {
  collection: string
  collectionLabel: string
  actions: Partial<Record<PermissionAction, boolean>>
  permissionIds: Partial<Record<PermissionAction, number>>
  dataScope?: DataScope
  dataScopeId?: number
}

export interface CollectionMeta {
  collection: string
  label: string
}
