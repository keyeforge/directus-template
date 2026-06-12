import {
  createItem,
  createPermission,
  createPermissions,
  deleteItem,
  deletePermission,
  readItems,
  readPermissions,
  updateItem,
} from '@directus/sdk'
import { supportsDataScope } from '@/constants/dataScope'
import { directus } from '@/services/directus'
import { listManageableCollections } from '@/services/collections'
import type {
  DataScope,
  PermissionAction,
  PermissionMatrixRow,
  PermissionRecord,
  PolicyDataScopeRecord,
} from '@/types/rbac'

const MANAGED_ACTIONS: PermissionAction[] = [
  'create',
  'read',
  'update',
  'delete',
]

export async function listPolicyPermissions(
  policyId: string,
): Promise<PermissionRecord[]> {
  return directus.request(
    readPermissions({
      filter: { policy: { _eq: policyId } },
      fields: [
        'id',
        'collection',
        'action',
        'fields',
        'permissions',
        'validation',
        'presets',
      ],
      limit: -1,
    }),
  ) as Promise<PermissionRecord[]>
}

export async function loadPolicyDataScopes(
  policyId: string,
): Promise<PolicyDataScopeRecord[]> {
  return directus.request(
    readItems('policy_data_scopes', {
      filter: { policy_id: { _eq: policyId } },
      fields: ['id', 'policy_id', 'collection', 'scope'],
      limit: -1,
    }),
  ) as Promise<PolicyDataScopeRecord[]>
}

export async function savePolicyDataScopes(
  policyId: string,
  rows: PermissionMatrixRow[],
): Promise<void> {
  const existing = await loadPolicyDataScopes(policyId)
  const existingMap = new Map(
    existing.map((item) => [item.collection, item]),
  )

  const tasks: Promise<unknown>[] = []

  for (const row of rows) {
    if (!supportsDataScope(row.collection)) continue
    if (!row.actions.read) {
      const current = existingMap.get(row.collection)
      if (current) {
        tasks.push(directus.request(deleteItem('policy_data_scopes', current.id)))
      }
      continue
    }

    const scope: DataScope = row.dataScope ?? 'self'
    const current = existingMap.get(row.collection)

    if (current) {
      if (current.scope !== scope) {
        tasks.push(
          directus.request(
            updateItem('policy_data_scopes', current.id, { scope }),
          ),
        )
      }
    } else {
      tasks.push(
        directus.request(
          createItem('policy_data_scopes', {
            policy_id: policyId,
            collection: row.collection,
            scope,
          }),
        ),
      )
    }
  }

  await Promise.all(tasks)
}

export async function buildPermissionMatrix(
  policyId: string,
): Promise<PermissionMatrixRow[]> {
  const [collections, permissions, dataScopes] = await Promise.all([
    listManageableCollections(),
    listPolicyPermissions(policyId),
    loadPolicyDataScopes(policyId),
  ])

  const permissionMap = new Map<string, PermissionRecord[]>()
  for (const permission of permissions) {
    const list = permissionMap.get(permission.collection) ?? []
    list.push(permission)
    permissionMap.set(permission.collection, list)
  }

  const scopeMap = new Map(
    dataScopes.map((item) => [item.collection, item]),
  )

  return collections.map((collection) => {
    const rows = permissionMap.get(collection.collection) ?? []
    const scopeRecord = scopeMap.get(collection.collection)
    const actions: Partial<Record<PermissionAction, boolean>> = {}
    const permissionIds: Partial<Record<PermissionAction, number>> = {}

    for (const action of MANAGED_ACTIONS) {
      const match = rows.find((item) => item.action === action)
      actions[action] = Boolean(match)
      if (match) {
        permissionIds[action] = match.id
      }
    }

    return {
      collection: collection.collection,
      collectionLabel: collection.label,
      actions,
      permissionIds,
      dataScope: scopeRecord?.scope ?? 'self',
      dataScopeId: scopeRecord?.id,
    }
  })
}

export async function savePermissionMatrix(
  policyId: string,
  rows: PermissionMatrixRow[],
): Promise<void> {
  const existing = await listPolicyPermissions(policyId)
  const existingMap = new Map<string, PermissionRecord>()

  for (const permission of existing) {
    existingMap.set(`${permission.collection}:${permission.action}`, permission)
  }

  const toDelete: number[] = []
  const toCreate: Array<{
    policy: string
    collection: string
    action: PermissionAction
    fields: string[]
  }> = []

  for (const row of rows) {
    for (const action of MANAGED_ACTIONS) {
      const key = `${row.collection}:${action}`
      const enabled = row.actions[action] === true
      const existingPermission = existingMap.get(key)

      if (enabled && !existingPermission) {
        toCreate.push({
          policy: policyId,
          collection: row.collection,
          action,
          fields: ['*'],
        })
      }

      if (!enabled && existingPermission) {
        toDelete.push(existingPermission.id)
      }
    }
  }

  await Promise.all([
    ...toDelete.map((id) => directus.request(deletePermission(id))),
    toCreate.length
      ? directus.request(createPermissions(toCreate))
      : Promise.resolve(),
  ])

  await savePolicyDataScopes(policyId, rows)
}

export async function grantFullCollectionAccess(
  policyId: string,
  collection: string,
): Promise<void> {
  const existing = await listPolicyPermissions(policyId)
  const existingActions = new Set(
    existing
      .filter((item) => item.collection === collection)
      .map((item) => item.action),
  )

  const toCreate = MANAGED_ACTIONS.filter(
    (action) => !existingActions.has(action),
  ).map((action) => ({
    policy: policyId,
    collection,
    action,
    fields: ['*'],
  }))

  if (toCreate.length) {
    await directus.request(createPermissions(toCreate))
  }
}

export async function revokeCollectionAccess(
  policyId: string,
  collection: string,
): Promise<void> {
  const existing = await listPolicyPermissions(policyId)
  const toDelete = existing
    .filter((item) => item.collection === collection)
    .map((item) => item.id)

  await Promise.all(
    toDelete.map((id) => directus.request(deletePermission(id))),
  )
}

export async function createSinglePermission(
  policyId: string,
  collection: string,
  action: PermissionAction,
): Promise<PermissionRecord> {
  return directus.request(
    createPermission({
      policy: policyId,
      collection,
      action,
      fields: ['*'],
    }),
  ) as Promise<PermissionRecord>
}
