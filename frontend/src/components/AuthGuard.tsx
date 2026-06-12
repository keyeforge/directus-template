import { Result, Spin } from 'antd'
import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

export default function AuthGuard() {
  const location = useLocation()
  const { user, initialized, initialize, policyGlobals } = useAuthStore()
  const [hydrated, setHydrated] = useState(() =>
    useAuthStore.persist.hasHydrated(),
  )

  useEffect(() => {
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  useEffect(() => {
    if (hydrated && !initialized) {
      void initialize()
    }
  }, [hydrated, initialized, initialize])

  if (!hydrated || !initialized) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (
    policyGlobals &&
    !policyGlobals.admin_access &&
    !policyGlobals.app_access
  ) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="你没有应用访问权限，请联系管理员"
      />
    )
  }

  return <Outlet />
}
