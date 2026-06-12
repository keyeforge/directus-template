import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { ProLayout } from '@ant-design/pro-components'
import { Dropdown, message } from 'antd'
import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  menuRouteConfigs,
  type MenuAccess,
  type MenuRouteConfig,
} from '@/constants/menuRoutes'
import { useAuthStore } from '@/stores/auth'
import type { PermissionAction } from '@/types/rbac'

interface MenuRoute {
  path?: string
  name: string
  icon?: MenuRouteConfig['icon']
  routes?: MenuRoute[]
}

function canShowMenuItem(
  access: MenuAccess | undefined,
  isAdmin: boolean,
  canAccess: (collection: string, action?: PermissionAction) => boolean,
): boolean {
  if (!access || access.type === 'public') return true
  if (access.type === 'admin') return isAdmin
  return isAdmin || canAccess(access.collection, access.action ?? 'read')
}

function filterMenuRoutes(
  routes: MenuRouteConfig[],
  isAdmin: boolean,
  canAccess: (collection: string, action?: PermissionAction) => boolean,
): MenuRoute[] {
  return routes
    .map((route) => {
      if (route.routes) {
        const children = filterMenuRoutes(route.routes, isAdmin, canAccess)
        if (!children.length) return null
        return { ...route, routes: children }
      }

      if (!canShowMenuItem(route.access, isAdmin, canAccess)) {
        return null
      }

      return route
    })
    .filter((route): route is MenuRoute => route !== null)
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, policyGlobals, permissions, canAccess } = useAuthStore()

  const menuRoutes = useMemo(
    () => ({
      path: '/',
      routes: filterMenuRoutes(
        menuRouteConfigs,
        policyGlobals?.admin_access === true,
        canAccess,
      ),
    }),
    [policyGlobals, permissions, canAccess],
  )

  const displayName = useMemo(() => {
    if (!user) return '管理员'
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')
    return fullName || user.email
  }, [user])

  const handleLogout = async () => {
    try {
      await logout()
      message.success('已退出登录')
      navigate('/login', { replace: true })
    } catch {
      message.error('退出登录失败')
    }
  }

  return (
    <ProLayout
      title="NodeMP 管理后台"
      logo={false}
      layout="mix"
      fixSiderbar
      route={menuRoutes}
      location={{ pathname: location.pathname }}
      menuItemRender={(item, dom) => (
        <div
          onClick={() => {
            if (item.path) {
              navigate(item.path)
            }
          }}
        >
          {dom}
        </div>
      )}
      avatarProps={{
        src: user?.avatar ?? undefined,
        title: displayName,
        icon: <UserOutlined />,
        render: (_, dom) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: () => {
                    void handleLogout()
                  },
                },
              ],
            }}
          >
            {dom}
          </Dropdown>
        ),
      }}
    >
      <Outlet />
    </ProLayout>
  )
}
