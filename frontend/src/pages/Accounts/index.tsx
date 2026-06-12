import { PlusOutlined } from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components'
import { Button, message, Popconfirm, Tag } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import {
  buildDepartmentOptions,
  listDepartments,
} from '@/services/departments'
import { listUserOptions } from '@/services/user-options'
import {
  createAccountUser,
  listRoles,
  listUsers,
  removeAccountUser,
  updateAccountUser,
} from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import type {
  AccountUser,
  AccountUserInput,
  DirectusRoleOption,
  UserStatus,
} from '@/types/user'
import { tableSearchConfig } from '@/constants/table'

const statusMap: Record<UserStatus, { text: string; color: string }> = {
  active: { text: '正常', color: 'success' },
  invited: { text: '已邀请', color: 'processing' },
  draft: { text: '草稿', color: 'default' },
  suspended: { text: '已停用', color: 'warning' },
  archived: { text: '已归档', color: 'default' },
}

const statusOptions = Object.entries(statusMap).map(([value, item]) => ({
  label: item.text,
  value,
}))

function getDisplayName(user: AccountUser): string {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')
  return fullName || user.email
}

function getRoleName(
  role: AccountUser['role'],
  roleMap: Map<string, string>,
): string {
  if (!role) return '-'
  if (typeof role === 'string') return roleMap.get(role) ?? role
  return role.name || '-'
}

export default function AccountsPage() {
  const actionRef = useRef<ActionType>(null)
  const currentUser = useAuthStore((state) => state.user)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AccountUser | null>(null)
  const [roles, setRoles] = useState<DirectusRoleOption[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<
    { label: string; value: number }[]
  >([])
  const [managerOptions, setManagerOptions] = useState<
    { label: string; value: string }[]
  >([])

  useEffect(() => {
    void Promise.all([listRoles(), listDepartments(), listUserOptions()])
      .then(([roleList, departments, users]) => {
        setRoles(roleList)
        setDepartmentOptions(buildDepartmentOptions(departments))
        setManagerOptions(users)
      })
      .catch(() => {
        message.error('加载表单选项失败')
      })
  }, [])

  const roleOptions = roles.map((role) => ({
    label: role.name,
    value: role.id,
  }))

  const roleMap = new Map(roles.map((role) => [role.id, role.name]))

  const openCreateModal = () => {
    setEditingUser(null)
    setModalOpen(true)
  }

  const openEditModal = (record: AccountUser) => {
    setEditingUser(record)
    setModalOpen(true)
  }

  const handleSubmit = async (values: AccountUserInput) => {
    try {
      const roleId =
        typeof values.role === 'object' && values.role !== null
          ? (values.role as DirectusRoleOption).id
          : values.role

      const payload: AccountUserInput = {
        ...values,
        role: roleId ?? null,
      }

      if (editingUser) {
        await updateAccountUser(editingUser.id, payload)
        message.success('账号更新成功')
      } else {
        await createAccountUser(payload)
        message.success('账号创建成功')
      }
      setModalOpen(false)
      actionRef.current?.reload()
      return true
    } catch {
      message.error(editingUser ? '账号更新失败' : '账号创建失败')
      return false
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await removeAccountUser(id)
      message.success('账号已删除')
      actionRef.current?.reload()
    } catch {
      message.error('删除失败')
    }
  }

  const columns: ProColumns<AccountUser>[] = [
    {
      title: '邮箱',
      dataIndex: 'email',
      ellipsis: true,
    },
    {
      title: '姓名',
      dataIndex: 'first_name',
      search: false,
      render: (_, record) => getDisplayName(record),
    },
    {
      title: '角色',
      dataIndex: 'role',
      search: false,
      render: (_, record) => getRoleName(record.role, roleMap),
    },
    {
      title: '部门',
      dataIndex: 'department_id',
      search: false,
      render: (_, record) => {
        const dept = record.department_id
        if (!dept) return '-'
        if (typeof dept === 'object') return dept.name
        return departmentOptions.find((item) => item.value === dept)?.label ?? dept
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        active: { text: '正常', status: 'Success' },
        invited: { text: '已邀请', status: 'Processing' },
        draft: { text: '草稿', status: 'Default' },
        suspended: { text: '已停用', status: 'Warning' },
        archived: { text: '已归档', status: 'Default' },
      },
      render: (_, record) => {
        const status = (record.status ?? 'active') as UserStatus
        const config = statusMap[status] ?? statusMap.active
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '最后登录',
      dataIndex: 'last_access',
      search: false,
      render: (_, record) =>
        record.last_access
          ? dayjs(record.last_access).format('YYYY-MM-DD HH:mm')
          : '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      render: (_, record) => {
        const isSelf = record.id === currentUser?.id

        return [
          <a key="edit" onClick={() => openEditModal(record)}>
            编辑
          </a>,
          isSelf ? (
            <span key="delete" style={{ color: '#bfbfbf', cursor: 'not-allowed' }}>
              删除
            </span>
          ) : (
            <Popconfirm
              key="delete"
              title="确认删除该账号？"
              onConfirm={() => handleDelete(record.id)}
            >
              <a style={{ color: '#ff4d4f' }}>删除</a>
            </Popconfirm>
          ),
        ]
      },
    },
  ]

  const editingRoleId =
    editingUser?.role && typeof editingUser.role === 'object'
      ? editingUser.role.id
      : editingUser?.role

  const editingDepartmentId =
    editingUser?.department_id && typeof editingUser.department_id === 'object'
      ? editingUser.department_id.id
      : editingUser?.department_id

  const editingManagerId =
    editingUser?.manager_id && typeof editingUser.manager_id === 'object'
      ? editingUser.manager_id.id
      : editingUser?.manager_id

  return (
    <PageContainer title="账号管理" subTitle="管理 Directus 系统用户">
      <ProTable<AccountUser>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        cardBordered
        search={tableSearchConfig}
        request={async (params) => {
          try {
            const result = await listUsers({
              current: params.current,
              pageSize: params.pageSize,
              email: params.email,
              status: params.status as UserStatus | undefined,
            })
            return {
              data: result.data,
              success: true,
              total: result.total,
            }
          } catch {
            message.error('加载账号列表失败')
            return { data: [], success: false, total: 0 }
          }
        }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            新建账号
          </Button>,
        ]}
      />

      <ModalForm<AccountUserInput>
        title={editingUser ? '编辑账号' : '新建账号'}
        open={modalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setModalOpen(false),
        }}
        initialValues={
          editingUser
            ? {
                email: editingUser.email,
                first_name: editingUser.first_name,
                last_name: editingUser.last_name,
                status: editingUser.status ?? 'active',
                role: editingRoleId,
                department_id: editingDepartmentId,
                manager_id: editingManagerId,
              }
            : {
                status: 'active',
              }
        }
        onFinish={handleSubmit}
      >
        <ProFormText
          name="email"
          label="邮箱"
          placeholder="请输入邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        />
        <ProFormText
          name="password"
          label="密码"
          placeholder={editingUser ? '留空则不修改密码' : '请输入密码'}
          fieldProps={{ type: 'password' }}
          rules={
            editingUser
              ? []
              : [{ required: true, message: '请输入密码' }]
          }
        />
        <ProFormText name="first_name" label="名" placeholder="请输入名" />
        <ProFormText name="last_name" label="姓" placeholder="请输入姓" />
        <ProFormSelect
          name="role"
          label="角色"
          options={roleOptions}
          placeholder="请选择角色"
          rules={[{ required: true, message: '请选择角色' }]}
        />
        <ProFormSelect
          name="department_id"
          label="部门"
          options={departmentOptions}
          placeholder="请选择部门"
          allowClear
        />
        <ProFormSelect
          name="manager_id"
          label="直属上级"
          options={managerOptions.filter(
            (item) => item.value !== editingUser?.id,
          )}
          placeholder="请选择直属上级"
          allowClear
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={statusOptions}
          rules={[{ required: true, message: '请选择状态' }]}
        />
      </ModalForm>
    </PageContainer>
  )
}
