import {
  ContactsOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FundProjectionScreenOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import type { PermissionAction } from '@/types/rbac'

export type MenuAccess =
  | { type: 'collection'; collection: string; action?: PermissionAction }
  | { type: 'admin' }
  | { type: 'public' }

export interface MenuRouteConfig {
  path?: string
  name: string
  icon?: ReactNode
  access?: MenuAccess
  routes?: MenuRouteConfig[]
}

export const menuRouteConfigs: MenuRouteConfig[] = [
  {
    path: '/dashboard',
    name: '仪表盘',
    icon: <DashboardOutlined />,
    access: { type: 'public' },
  },
  {
    path: '/products',
    name: '产品管理',
    icon: <ShoppingOutlined />,
    access: { type: 'collection', collection: 'products', action: 'read' },
  },
  {
    path: '/customers',
    name: '客户管理',
    icon: <TeamOutlined />,
    access: { type: 'collection', collection: 'customers', action: 'read' },
  },
  {
    path: '/contacts',
    name: '联系人管理',
    icon: <ContactsOutlined />,
    access: { type: 'collection', collection: 'contacts', action: 'read' },
  },
  {
    path: '/opportunities',
    name: '商机管理',
    icon: <FundProjectionScreenOutlined />,
    access: { type: 'collection', collection: 'opportunities', action: 'read' },
  },
  {
    path: '/quotes',
    name: '报价管理',
    icon: <FileTextOutlined />,
    access: { type: 'collection', collection: 'quotes', action: 'read' },
  },
  {
    path: '/system',
    name: '权限管理',
    icon: <SafetyCertificateOutlined />,
    routes: [
      { path: '/departments', name: '部门管理', access: { type: 'admin' } },
      { path: '/roles', name: '角色管理', access: { type: 'admin' } },
      { path: '/policies', name: '策略管理', access: { type: 'admin' } },
      { path: '/accounts', name: '账号管理', access: { type: 'admin' } },
    ],
  },
  {
    path: '/welcome',
    name: '欢迎页',
    icon: <UserOutlined />,
    access: { type: 'public' },
  },
]
