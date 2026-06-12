import type { ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth'
import type { PermissionAction } from '@/types/rbac'

export function useCanAccess(
  collection: string,
  action: PermissionAction = 'read',
): boolean {
  return useAuthStore((state) => state.canAccess(collection, action))
}

interface CanAccessProps {
  collection: string
  action?: PermissionAction
  children: ReactNode
  fallback?: ReactNode
}

export default function CanAccess({
  collection,
  action = 'read',
  children,
  fallback = null,
}: CanAccessProps) {
  const allowed = useCanAccess(collection, action)
  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}
