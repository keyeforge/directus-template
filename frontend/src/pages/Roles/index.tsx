import { PlusOutlined } from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components'
import { Button, message, Popconfirm, Tag } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { listAllPolicies } from '@/services/policies'
import {
  createRoleRecord,
  getRolePolicyIds,
  listRolesDetailed,
  removeRole,
  updateRoleRecord,
} from '@/services/roles'
import { useAuthStore } from '@/stores/auth'
import type { PolicyRecord, RoleInput, RoleRecord } from '@/types/rbac'
import { tableSearchConfig } from '@/constants/table'

function getParentName(role: RoleRecord): string {
  if (!role.parent) return '-'
  if (typeof role.parent === 'string') return role.parent
  return role.parent.name
}

function getPolicyNames(role: RoleRecord): string[] {
  if (!role.policies?.length) return []

  return role.policies
    .map((entry) => {
      const policy = entry.policy
      if (!policy || typeof policy === 'string') return null
      return policy.name
    })
    .filter((name): name is string => Boolean(name))
}

export default function RolesPage() {
  const fetchAccess = useAuthStore((state) => state.fetchAccess)
  const actionRef = useRef<ActionType>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null)
  const [policies, setPolicies] = useState<PolicyRecord[]>([])
  const [allRoles, setAllRoles] = useState<RoleRecord[]>([])

  useEffect(() => {
    void Promise.all([listAllPolicies(), listRolesDetailed({ pageSize: 100 })])
      .then(([policyList, roleResult]) => {
        setPolicies(policyList)
        setAllRoles(roleResult.data)
      })
      .catch(() => {
        message.error('加载角色配置数据失败')
      })
  }, [])

  const policyOptions = policies.map((policy) => ({
    label: policy.name,
    value: policy.id,
  }))

  const parentOptions = allRoles
    .filter((role) => role.id !== editingRole?.id)
    .map((role) => ({
      label: role.name,
      value: role.id,
    }))

  const openCreateModal = () => {
    setEditingRole(null)
    setModalOpen(true)
  }

  const openEditModal = (record: RoleRecord) => {
    setEditingRole(record)
    setModalOpen(true)
  }

  const handleSubmit = async (values: RoleInput) => {
    try {
      if (editingRole) {
        await updateRoleRecord(editingRole.id, values)
        message.success('角色更新成功')
      } else {
        await createRoleRecord(values)
        message.success('角色创建成功')
      }
      setModalOpen(false)
      await fetchAccess()
      actionRef.current?.reload()
      const roleResult = await listRolesDetailed({ pageSize: 100 })
      setAllRoles(roleResult.data)
      return true
    } catch {
      message.error(editingRole ? '角色更新失败' : '角色创建失败')
      return false
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await removeRole(id)
      message.success('角色已删除')
      actionRef.current?.reload()
    } catch {
      message.error('删除失败，请确认该角色下没有关联用户')
    }
  }

  const columns: ProColumns<RoleRecord>[] = [
    {
      title: '角色名称',
      dataIndex: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      search: false,
      ellipsis: true,
      render: (_, record) => record.description || '-',
    },
    {
      title: '父角色',
      dataIndex: 'parent',
      search: false,
      render: (_, record) => getParentName(record),
    },
    {
      title: '绑定策略',
      dataIndex: 'policies',
      search: false,
      render: (_, record) => {
        const names = getPolicyNames(record)
        if (!names.length) return '-'
        return names.map((name) => (
          <Tag key={name} color="blue">
            {name}
          </Tag>
        ))
      },
    },
    {
      title: '用户数',
      dataIndex: 'users',
      search: false,
      render: (_, record) => record.users?.length ?? 0,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 140,
      render: (_, record) => [
        <a key="edit" onClick={() => openEditModal(record)}>
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确认删除该角色？"
          description="若角色下仍有用户，删除可能失败"
          onConfirm={() => handleDelete(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer title="角色管理" subTitle="管理 Directus 角色及其策略绑定">
      <ProTable<RoleRecord>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        cardBordered
        search={tableSearchConfig}
        request={async (params) => {
          try {
            const result = await listRolesDetailed({
              current: params.current,
              pageSize: params.pageSize,
              name: params.name,
            })
            return {
              data: result.data,
              success: true,
              total: result.total,
            }
          } catch {
            message.error('加载角色列表失败')
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
            新建角色
          </Button>,
        ]}
      />

      <ModalForm<RoleInput>
        title={editingRole ? '编辑角色' : '新建角色'}
        open={modalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setModalOpen(false),
        }}
        initialValues={
          editingRole
            ? {
                name: editingRole.name,
                icon: editingRole.icon,
                description: editingRole.description,
                parent:
                  typeof editingRole.parent === 'object'
                    ? editingRole.parent?.id
                    : editingRole.parent,
                policyIds: getRolePolicyIds(editingRole),
              }
            : {
                icon: 'supervised_user_circle',
              }
        }
        onFinish={handleSubmit}
      >
        <ProFormText
          name="name"
          label="角色名称"
          placeholder="请输入角色名称"
          rules={[{ required: true, message: '请输入角色名称' }]}
        />
        <ProFormText
          name="icon"
          label="图标"
          placeholder="Material Icons 名称，如 supervised_user_circle"
        />
        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="请输入角色描述"
        />
        <ProFormSelect
          name="parent"
          label="父角色"
          options={parentOptions}
          placeholder="可选，用于角色继承"
          allowClear
        />
        <ProFormSelect
          name="policyIds"
          label="绑定策略"
          mode="multiple"
          options={policyOptions}
          placeholder="选择该角色关联的策略"
          rules={[{ required: true, message: '请至少选择一个策略' }]}
        />
      </ModalForm>
    </PageContainer>
  )
}
