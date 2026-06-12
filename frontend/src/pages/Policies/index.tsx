import { PlusOutlined } from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  ModalForm,
  PageContainer,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components'
import { Button, message, Popconfirm, Tag } from 'antd'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createPolicyRecord,
  listPolicies,
  removePolicy,
  updatePolicyRecord,
} from '@/services/policies'
import type { PolicyInput, PolicyRecord } from '@/types/rbac'
import { tableSearchConfig } from '@/constants/table'

export default function PoliciesPage() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<PolicyRecord | null>(null)

  const openCreateModal = () => {
    setEditingPolicy(null)
    setModalOpen(true)
  }

  const openEditModal = (record: PolicyRecord) => {
    setEditingPolicy(record)
    setModalOpen(true)
  }

  const handleSubmit = async (values: PolicyInput) => {
    try {
      if (editingPolicy) {
        await updatePolicyRecord(editingPolicy.id, values)
        message.success('策略更新成功')
      } else {
        await createPolicyRecord(values)
        message.success('策略创建成功')
      }
      setModalOpen(false)
      actionRef.current?.reload()
      return true
    } catch {
      message.error(editingPolicy ? '策略更新失败' : '策略创建失败')
      return false
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await removePolicy(id)
      message.success('策略已删除')
      actionRef.current?.reload()
    } catch {
      message.error('删除失败，请确认该策略未被角色引用')
    }
  }

  const columns: ProColumns<PolicyRecord>[] = [
    {
      title: '策略名称',
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
      title: '管理员权限',
      dataIndex: 'admin_access',
      search: false,
      render: (_, record) =>
        record.admin_access ? (
          <Tag color="red">Admin</Tag>
        ) : (
          <Tag>否</Tag>
        ),
    },
    {
      title: '应用访问',
      dataIndex: 'app_access',
      search: false,
      render: (_, record) =>
        record.app_access ? (
          <Tag color="green">允许</Tag>
        ) : (
          <Tag>否</Tag>
        ),
    },
    {
      title: '强制 2FA',
      dataIndex: 'enforce_tfa',
      search: false,
      render: (_, record) => (record.enforce_tfa ? '是' : '否'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      render: (_, record) => [
        <a key="permissions" onClick={() => navigate(`/policies/${record.id}/permissions`)}>
          权限配置
        </a>,
        <a key="edit" onClick={() => openEditModal(record)}>
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确认删除该策略？"
          description="删除后关联角色的权限将受影响"
          onConfirm={() => handleDelete(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer
      title="策略管理"
      subTitle="Directus 11 通过策略（Policy）管理权限，角色通过绑定策略获得权限"
    >
      <ProTable<PolicyRecord>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        cardBordered
        search={tableSearchConfig}
        request={async (params) => {
          try {
            const result = await listPolicies({
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
            message.error('加载策略列表失败')
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
            新建策略
          </Button>,
        ]}
      />

      <ModalForm<PolicyInput>
        title={editingPolicy ? '编辑策略' : '新建策略'}
        open={modalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setModalOpen(false),
        }}
        initialValues={
          editingPolicy
            ? {
                name: editingPolicy.name,
                icon: editingPolicy.icon,
                description: editingPolicy.description,
                ip_access: editingPolicy.ip_access,
                enforce_tfa: editingPolicy.enforce_tfa ?? false,
                admin_access: editingPolicy.admin_access ?? false,
                app_access: editingPolicy.app_access ?? true,
              }
            : {
                icon: 'policy',
                enforce_tfa: false,
                admin_access: false,
                app_access: true,
              }
        }
        onFinish={handleSubmit}
      >
        <ProFormText
          name="name"
          label="策略名称"
          placeholder="请输入策略名称"
          rules={[{ required: true, message: '请输入策略名称' }]}
        />
        <ProFormText
          name="icon"
          label="图标"
          placeholder="Material Icons 名称，如 policy"
        />
        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="请输入策略描述"
        />
        <ProFormText
          name="ip_access"
          label="IP 白名单"
          placeholder="可选，多个 IP 用逗号分隔"
        />
        <ProFormSwitch
          name="admin_access"
          label="管理员权限"
          tooltip="开启后将拥有全部系统权限，请谨慎分配"
        />
        <ProFormSwitch
          name="app_access"
          label="应用访问"
          tooltip="允许登录 Directus 应用/管理后台"
        />
        <ProFormSwitch name="enforce_tfa" label="强制双因素认证" />
      </ModalForm>
    </PageContainer>
  )
}
