import { Result } from 'antd'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import type { PermissionAction } from '@/types/rbac'

interface PermissionGuardProps {
  requireAdmin?: boolean
  collection?: string
  action?: PermissionAction
  children: ReactNode
}

export default function PermissionGuard({
  requireAdmin = false,
  collection,
  action = 'read',
  children,
}: PermissionGuardProps) {
  const isAdmin = useAuthStore((state) => state.isAdmin())
  const canAccess = useAuthStore((state) => state.canAccess)

  if (requireAdmin && !isAdmin) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="你没有权限访问系统管理功能"
      />
    )
  }

  if (collection && !canAccess(collection, action)) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="你没有权限访问此页面"
      />
    )
  }

  return children
}

interface AdminRouteProps {
  children: ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const isAdmin = useAuthStore((state) => state.isAdmin())

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
