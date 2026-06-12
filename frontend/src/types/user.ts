export type UserStatus = 'active' | 'invited' | 'draft' | 'suspended' | 'archived'

export interface DirectusRoleOption {
  id: string
  name: string
}

export interface DepartmentRef {
  id: number
  name: string
}

export interface UserRef {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}

export interface AccountUser {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  avatar?: string | null
  status?: UserStatus | null
  role?: string | DirectusRoleOption | null
  department_id?: number | DepartmentRef | null
  manager_id?: string | UserRef | null
  last_access?: string | null
}

export interface AccountUserInput {
  email: string
  password?: string
  first_name?: string | null
  last_name?: string | null
  status?: UserStatus
  role?: string | null
  department_id?: number | null
  manager_id?: string | null
}

export interface UserOption {
  label: string
  value: string
}
