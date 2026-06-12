import { ForbiddenError } from '@directus/errors'

const SCOPED_COLLECTIONS = new Set([
  'customers',
  'opportunities',
  'quotes',
  'contacts',
  'customer_follow_ups',
  'quote_items',
])

const OWNER_COLLECTIONS = new Set(['customers', 'opportunities', 'quotes'])

const OWNER_PATHS = {
  customers: ['owner_id'],
  opportunities: ['owner_id'],
  quotes: ['owner_id'],
  contacts: ['customer_id', 'owner_id'],
  customer_follow_ups: ['customer_id', 'owner_id'],
  quote_items: ['quote_id', 'owner_id'],
}

const PARENT_FIELDS = {
  contacts: 'customer_id',
  customer_follow_ups: 'customer_id',
  quote_items: 'quote_id',
}

const PARENT_COLLECTIONS = {
  contacts: 'customers',
  customer_follow_ups: 'customers',
  quote_items: 'quotes',
}

const SCOPE_RANK = {
  self: 1,
  subordinates: 2,
  department: 3,
  all: 4,
}

function forbid() {
  throw new ForbiddenError()
}

function mergeFilters(existing, extra) {
  if (!existing) return extra
  return { _and: [existing, extra] }
}

function nestFilter(path, leaf) {
  if (path.length === 1) {
    return { [path[0]]: leaf }
  }
  return { [path[0]]: nestFilter(path.slice(1), leaf) }
}

function shouldBypassScope(context) {
  return Boolean(context.accountability?.admin)
}

async function rebuildDepartmentClosure(database) {
  await database('department_closure').delete()
  const departments = await database('departments').select('id', 'parent_id')

  const childrenMap = new Map()
  for (const dept of departments) {
    if (dept.parent_id == null) continue
    const list = childrenMap.get(dept.parent_id) ?? []
    list.push(dept.id)
    childrenMap.set(dept.parent_id, list)
  }

  const rows = []
  const visit = (ancestorId, currentId) => {
    rows.push({ ancestor_id: ancestorId, descendant_id: currentId })
    for (const childId of childrenMap.get(currentId) ?? []) {
      visit(ancestorId, childId)
    }
  }

  for (const dept of departments) {
    visit(dept.id, dept.id)
  }

  if (rows.length) {
    await database('department_closure').insert(rows)
  }
}

async function rebuildUserReportingClosure(database) {
  await database('user_reporting_closure').delete()
  const users = await database('directus_users').select('id', 'manager_id')

  const reportsMap = new Map()
  for (const user of users) {
    if (!user.manager_id) continue
    const list = reportsMap.get(user.manager_id) ?? []
    list.push(user.id)
    reportsMap.set(user.manager_id, list)
  }

  const rows = []
  const visit = (managerId, subordinateId) => {
    rows.push({ manager_id: managerId, subordinate_id: subordinateId })
    for (const childId of reportsMap.get(subordinateId) ?? []) {
      visit(managerId, childId)
    }
  }

  for (const user of users) {
    rows.push({ manager_id: user.id, subordinate_id: user.id })
    visit(user.id, user.id)
  }

  if (rows.length) {
    const unique = Array.from(
      new Map(rows.map((row) => [`${row.manager_id}:${row.subordinate_id}`, row])).values(),
    )
    await database('user_reporting_closure').insert(unique)
  }
}

async function getSubordinateIds(database, userId) {
  const rows = await database('user_reporting_closure')
    .select('subordinate_id')
    .where('manager_id', userId)
  const ids = rows.map((row) => row.subordinate_id)
  return ids.length ? ids : [userId]
}

async function getDepartmentSubtreeIds(database, userId) {
  const user = await database('directus_users')
    .select('department_id')
    .where('id', userId)
    .first()

  if (!user?.department_id) return []

  const rows = await database('department_closure')
    .select('descendant_id')
    .where('ancestor_id', user.department_id)

  const ids = rows.map((row) => row.descendant_id)
  return ids.length ? ids : [user.department_id]
}

async function getUserPolicyScopes(database, userId, collection) {
  const user = await database('directus_users')
    .select('id', 'role')
    .where('id', userId)
    .first()

  if (!user) return { isAdmin: false, scope: 'self' }

  const accessRows = await database('directus_access')
    .select('policy')
    .where('role', user.role)
    .orWhere('user', userId)

  const policyIds = [...new Set(accessRows.map((row) => row.policy).filter(Boolean))]
  if (!policyIds.length) return { isAdmin: false, scope: 'self' }

  const policies = await database('directus_policies')
    .select('id', 'admin_access')
    .whereIn('id', policyIds)

  if (policies.some((policy) => policy.admin_access)) {
    return { isAdmin: true, scope: 'all' }
  }

  const scopeRows = await database('policy_data_scopes')
    .select('scope')
    .whereIn('policy_id', policyIds)
    .andWhere('collection', collection)

  let bestScope = 'self'
  let bestRank = SCOPE_RANK.self

  for (const row of scopeRows) {
    const rank = SCOPE_RANK[row.scope] ?? 0
    if (rank > bestRank) {
      bestRank = rank
      bestScope = row.scope
    }
  }

  return { isAdmin: false, scope: bestScope }
}

async function buildScopeFilter(database, userId, collection, scope) {
  if (scope === 'all') return null

  const path = OWNER_PATHS[collection]
  if (!path) return null

  if (scope === 'self') {
    return nestFilter(path, { _eq: userId })
  }

  if (scope === 'subordinates') {
    const ids = await getSubordinateIds(database, userId)
    return nestFilter(path, { _in: ids })
  }

  if (scope === 'department') {
    const deptIds = await getDepartmentSubtreeIds(database, userId)
    if (!deptIds.length) {
      return nestFilter(path, { _eq: userId })
    }
    return nestFilter(path, { department_id: { _in: deptIds } })
  }

  return null
}

function applyOwnerScopeToBuilder(query, ownerColumn, userId, scope, deptIds, subordinateIds) {
  if (scope === 'self') {
    query.where(ownerColumn, userId)
    return
  }

  if (scope === 'subordinates') {
    query.whereIn(ownerColumn, subordinateIds)
    return
  }

  if (scope === 'department') {
    if (!deptIds.length) {
      query.where(ownerColumn, userId)
      return
    }
    query.whereIn(ownerColumn, function deptUsers() {
      this.select('id').from('directus_users').whereIn('department_id', deptIds)
    })
  }
}

async function countAccessibleKeys(database, collection, keys, userId, scope) {
  if (!keys.length) return 0

  const subordinateIds = scope === 'subordinates'
    ? await getSubordinateIds(database, userId)
    : []
  const deptIds = scope === 'department'
    ? await getDepartmentSubtreeIds(database, userId)
    : []

  if (OWNER_COLLECTIONS.has(collection)) {
    const query = database(collection).whereIn('id', keys)
    applyOwnerScopeToBuilder(query, 'owner_id', userId, scope, deptIds, subordinateIds)
    const result = await query.count({ count: '*' })
    return Number(result[0]?.count ?? 0)
  }

  if (collection === 'contacts') {
    const query = database('contacts').whereIn('id', keys)
    query.whereIn('customer_id', function ownedCustomers() {
      this.select('id').from('customers')
      applyOwnerScopeToBuilder(this, 'owner_id', userId, scope, deptIds, subordinateIds)
    })
    const result = await query.count({ count: '*' })
    return Number(result[0]?.count ?? 0)
  }

  if (collection === 'customer_follow_ups') {
    const query = database('customer_follow_ups').whereIn('id', keys)
    query.whereIn('customer_id', function ownedCustomers() {
      this.select('id').from('customers')
      applyOwnerScopeToBuilder(this, 'owner_id', userId, scope, deptIds, subordinateIds)
    })
    const result = await query.count({ count: '*' })
    return Number(result[0]?.count ?? 0)
  }

  if (collection === 'quote_items') {
    const query = database('quote_items').whereIn('id', keys)
    query.whereIn('quote_id', function ownedQuotes() {
      this.select('id').from('quotes')
      applyOwnerScopeToBuilder(this, 'owner_id', userId, scope, deptIds, subordinateIds)
    })
    const result = await query.count({ count: '*' })
    return Number(result[0]?.count ?? 0)
  }

  return keys.length
}

async function isOwnerIdAssignable(database, userId, scope, ownerId) {
  if (scope === 'all') return true
  if (ownerId === userId) return true

  if (scope === 'subordinates') {
    const ids = await getSubordinateIds(database, userId)
    return ids.includes(ownerId)
  }

  if (scope === 'department') {
    const deptIds = await getDepartmentSubtreeIds(database, userId)
    if (!deptIds.length) return ownerId === userId

    const owner = await database('directus_users')
      .select('department_id')
      .where('id', ownerId)
      .first()

    return owner?.department_id != null && deptIds.includes(owner.department_id)
  }

  return false
}

async function assertOwnerIdAssignable(database, userId, scope, ownerId) {
  if (ownerId == null) return
  const allowed = await isOwnerIdAssignable(database, userId, scope, ownerId)
  if (!allowed) forbid()
}

async function assertParentIdInScope(database, parentCollection, parentId, userId, scope) {
  if (parentId == null) return

  const normalizedId = Number(parentId)
  if (!Number.isFinite(normalizedId)) forbid()

  const count = await countAccessibleKeys(
    database,
    parentCollection,
    [normalizedId],
    userId,
    scope,
  )

  if (count !== 1) forbid()
}

async function applyDataScopeToQuery(query, meta, context, database) {
  const { collection } = meta
  if (!SCOPED_COLLECTIONS.has(collection)) return query

  const userId = context.accountability?.user
  if (!userId || shouldBypassScope(context)) return query

  const { isAdmin, scope } = await getUserPolicyScopes(database, userId, collection)
  if (isAdmin) return query

  const scopeFilter = await buildScopeFilter(database, userId, collection, scope)
  if (!scopeFilter) return query

  query.filter = mergeFilters(query.filter, scopeFilter)
  return query
}

async function assertKeysInScope(keys, collection, context, database) {
  if (!keys?.length) return

  const userId = context.accountability?.user
  if (!userId || shouldBypassScope(context)) return

  const { isAdmin, scope } = await getUserPolicyScopes(database, userId, collection)
  if (isAdmin || scope === 'all') return

  const accessibleCount = await countAccessibleKeys(
    database,
    collection,
    keys,
    userId,
    scope,
  )

  if (accessibleCount !== keys.length) forbid()
}

async function assertCreatePayloadInScope(payload, collection, context, database) {
  const userId = context.accountability?.user
  if (!userId || shouldBypassScope(context)) return payload

  const { isAdmin, scope } = await getUserPolicyScopes(database, userId, collection)
  if (isAdmin || scope === 'all') return payload

  if (OWNER_COLLECTIONS.has(collection)) {
    const ownerId = payload.owner_id ?? userId
    await assertOwnerIdAssignable(database, userId, scope, ownerId)
    payload.owner_id = ownerId
  }

  const parentField = PARENT_FIELDS[collection]
  if (parentField) {
    await assertParentIdInScope(
      database,
      PARENT_COLLECTIONS[collection],
      payload[parentField],
      userId,
      scope,
    )
  }

  return payload
}

async function assertUpdatePayloadInScope(payload, collection, context, database) {
  const userId = context.accountability?.user
  if (!userId || shouldBypassScope(context)) return payload

  const { isAdmin, scope } = await getUserPolicyScopes(database, userId, collection)
  if (isAdmin || scope === 'all') return payload

  if (payload.owner_id !== undefined && OWNER_COLLECTIONS.has(collection)) {
    await assertOwnerIdAssignable(database, userId, scope, payload.owner_id)
  }

  const parentField = PARENT_FIELDS[collection]
  if (parentField && payload[parentField] !== undefined) {
    await assertParentIdInScope(
      database,
      PARENT_COLLECTIONS[collection],
      payload[parentField],
      userId,
      scope,
    )
  }

  return payload
}

export default ({ filter, action }, { database }) => {
  filter('items.query', async (query, meta, context) => {
    return applyDataScopeToQuery(query, meta, context, database)
  })

  filter('items.create', async (payload, meta, context) => {
    const { collection } = meta
    if (!SCOPED_COLLECTIONS.has(collection)) return payload

    return assertCreatePayloadInScope(payload, collection, context, database)
  })

  filter('items.update', async (payload, meta, context) => {
    const { collection, keys } = meta
    if (!SCOPED_COLLECTIONS.has(collection)) return payload

    await assertKeysInScope(keys, collection, context, database)
    return assertUpdatePayloadInScope(payload, collection, context, database)
  })

  filter('items.delete', async (keys, meta, context) => {
    const { collection } = meta
    if (!SCOPED_COLLECTIONS.has(collection)) return keys

    await assertKeysInScope(keys, collection, context, database)
    return keys
  })

  action('items.create', async (meta) => {
    if (meta.collection === 'departments') await rebuildDepartmentClosure(database)
    if (meta.collection === 'directus_users') await rebuildUserReportingClosure(database)
  })

  action('items.update', async (meta) => {
    if (meta.collection === 'departments') await rebuildDepartmentClosure(database)
    if (meta.collection === 'directus_users') await rebuildUserReportingClosure(database)
  })

  action('items.delete', async (meta) => {
    if (meta.collection === 'departments') await rebuildDepartmentClosure(database)
    if (meta.collection === 'directus_users') await rebuildUserReportingClosure(database)
  })

  rebuildDepartmentClosure(database).catch(() => {})
  rebuildUserReportingClosure(database).catch(() => {})
}
