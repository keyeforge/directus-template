import {
  readMe,
  readRolesMe,
  readUserPermissions,
} from '@directus/sdk'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { directus } from '@/services/directus'
import type { DirectusUser } from '@/types/directus'
import type {
  PermissionAction,
  PolicyGlobals,
  UserPermissions,
} from '@/types/rbac'

interface RolePolicyAccess {
  policy?: {
    admin_access?: boolean
    app_access?: boolean
    enforce_tfa?: boolean
  } | string | null
}

interface RoleWithPolicies {
  policies?: RolePolicyAccess[] | null
}

function derivePolicyGlobals(roles: RoleWithPolicies[]): PolicyGlobals {
  const globals: PolicyGlobals = {
    admin_access: false,
    app_access: false,
    enforce_tfa: false,
  }

  for (const role of roles) {
    for (const access of role.policies ?? []) {
      const policy = access.policy
      if (!policy || typeof policy === 'string') continue

      if (policy.admin_access) globals.admin_access = true
      if (policy.app_access) globals.app_access = true
      if (policy.enforce_tfa) globals.enforce_tfa = true
    }
  }

  return globals
}

const ADMIN_COLLECTIONS = [
  'directus_users',
  'directus_roles',
  'directus_policies',
  'directus_permissions',
  'directus_access',
]

function rolesExposePolicies(roles: RoleWithPolicies[]): boolean {
  return roles.some((role) =>
    (role.policies ?? []).some(
      (access) => access.policy && typeof access.policy === 'object',
    ),
  )
}

function hasAnyGrantedPermission(permissions: UserPermissions): boolean {
  return Object.values(permissions).some((actions) =>
    Object.values(actions).some(
      (perm) => perm?.access === 'full' || perm?.access === 'partial',
    ),
  )
}

function hasAdminCollectionAccess(permissions: UserPermissions): boolean {
  return ADMIN_COLLECTIONS.some((collection) => {
    const actions = permissions[collection]
    if (!actions) return false

    return Object.entries(actions).some(
      ([action, perm]) =>
        action !== 'read' &&
        (perm?.access === 'full' || perm?.access === 'partial'),
    )
  })
}

function supplementPolicyGlobals(
  globals: PolicyGlobals,
  roles: RoleWithPolicies[],
  permissions: UserPermissions,
): PolicyGlobals {
  if (rolesExposePolicies(roles)) return globals

  // 非管理员调用 /roles/me 时拿不到嵌套的 policy 字段，需从 permissions/me 推断
  return {
    ...globals,
    app_access: globals.app_access || hasAnyGrantedPermission(permissions),
    admin_access:
      globals.admin_access || hasAdminCollectionAccess(permissions),
  }
}

async function loadAccessContext() {
  const [roles, permissions] = await Promise.all([
    directus.request(
      readRolesMe({
        fields: [
          'id',
          'name',
          {
            policies: [
              {
                policy: ['admin_access', 'app_access', 'enforce_tfa'],
              },
            ],
          },
        ],
      } as never),
    ),
    directus.request(readUserPermissions()),
  ])

  const roleList = roles as RoleWithPolicies[]
  const permissionMap = permissions as UserPermissions

  return {
    policyGlobals: supplementPolicyGlobals(
      derivePolicyGlobals(roleList),
      roleList,
      permissionMap,
    ),
    permissions: permissionMap,
  }
}

interface AuthState {
  user: DirectusUser | null
  policyGlobals: PolicyGlobals | null
  permissions: UserPermissions | null
  loading: boolean
  initialized: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  fetchAccess: () => Promise<void>
  initialize: () => Promise<void>
  isAdmin: () => boolean
  canAccess: (collection: string, action?: PermissionAction) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      policyGlobals: null,
      permissions: null,
      loading: false,
      initialized: false,

      login: async (email, password) => {
        set({ loading: true })
        try {
          await directus.login(email, password)
          const user = await directus.request(readMe())
          const access = await loadAccessContext()
          set({
            user: user as DirectusUser,
            policyGlobals: access.policyGlobals,
            permissions: access.permissions,
            loading: false,
          })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await directus.logout()
        } finally {
          set({ user: null, policyGlobals: null, permissions: null })
        }
      },

      fetchUser: async () => {
        const user = await directus.request(readMe())
        set({ user: user as DirectusUser })
      },

      fetchAccess: async () => {
        const access = await loadAccessContext()
        set({
          policyGlobals: access.policyGlobals,
          permissions: access.permissions,
        })
      },

      initialize: async () => {
        set({ loading: true })

        const token = await directus.getToken()
        if (!token) {
          set({
            user: null,
            policyGlobals: null,
            permissions: null,
            initialized: true,
            loading: false,
          })
          return
        }

        try {
          const user = await directus.request(readMe())
          const access = await loadAccessContext()
          set({
            user: user as DirectusUser,
            policyGlobals: access.policyGlobals,
            permissions: access.permissions,
            initialized: true,
            loading: false,
          })
        } catch {
          await directus.logout()
          set({
            user: null,
            policyGlobals: null,
            permissions: null,
            initialized: true,
            loading: false,
          })
        }
      },

      isAdmin: () => get().policyGlobals?.admin_access === true,

      canAccess: (collection, action = 'read') => {
        const state = get()
        if (state.policyGlobals?.admin_access) return true

        const permission = state.permissions?.[collection]?.[action]
        return permission?.access === 'full' || permission?.access === 'partial'
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        policyGlobals: state.policyGlobals,
      }),
    },
  ),
)
