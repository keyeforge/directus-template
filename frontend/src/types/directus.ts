import type { Department } from '@/types/department'
import type { Contact } from '@/types/contact'
import type { Customer, CustomerFollowUp } from '@/types/customer'
import type { Opportunity } from '@/types/opportunity'
import type { Quote, QuoteItem } from '@/types/quote'
import type { Product } from '@/types/product'
import type {
  PermissionRecord,
  PolicyDataScopeRecord,
  PolicyRecord,
  RoleRecord,
} from '@/types/rbac'
import type { AccountUser } from '@/types/user'

export interface DirectusAccessRecord {
  id: string
  role?: string | null
  user?: string | null
  policy: string
  sort?: number | null
}

export interface DirectusUser {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  avatar?: string | null
  role?: string | null
}

export interface DirectusSchema {
  directus_users: AccountUser[]
  directus_roles: RoleRecord[]
  directus_policies: PolicyRecord[]
  directus_permissions: PermissionRecord[]
  directus_access: DirectusAccessRecord[]
  departments: Department[]
  policy_data_scopes: PolicyDataScopeRecord[]
  products: Product[]
  customers: Customer[]
  customer_follow_ups: CustomerFollowUp[]
  contacts: Contact[]
  opportunities: Opportunity[]
  quotes: Quote[]
  quote_items: QuoteItem[]
}
