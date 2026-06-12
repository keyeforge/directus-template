import { PlusOutlined } from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  ModalForm,
  PageContainer,
  ProFormDateTimePicker,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components'
import { Button, message, Popconfirm, Tag } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CanAccess from '@/components/CanAccess'
import {
  levelMap,
  levelOptions,
  sourceMap,
  sourceOptions,
  statusMap,
  statusOptions,
  industryOptions,
} from '@/constants/customer'
import { tableSearchConfig } from '@/constants/table'
import {
  createCustomer,
  listCustomers,
  removeCustomer,
  updateCustomer,
} from '@/services/customers'
import { listUserOptions } from '@/services/user-options'
import { useAuthStore } from '@/stores/auth'
import type {
  Customer,
  CustomerInput,
  CustomerLevel,
  CustomerSource,
  CustomerStatus,
} from '@/types/customer'
import type { UserOption } from '@/types/user'
import { withOwnerFields } from '@/utils/owner'

export default function CustomersPage() {
  const navigate = useNavigate()
  const isAdmin = useAuthStore((state) => state.isAdmin())
  const actionRef = useRef<ActionType>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [userOptions, setUserOptions] = useState<UserOption[]>([])

  useEffect(() => {
    if (!isAdmin) return

    void listUserOptions()
      .then(setUserOptions)
      .catch(() => {
        message.error('加载负责人选项失败')
      })
  }, [isAdmin])

  const openCreateModal = () => {
    setEditingCustomer(null)
    setModalOpen(true)
  }

  const openEditModal = (record: Customer) => {
    setEditingCustomer(record)
    setModalOpen(true)
  }

  const handleSubmit = async (values: CustomerInput) => {
    try {
      const payload: CustomerInput = withOwnerFields(
        {
          ...values,
          last_contact_at: values.last_contact_at
            ? dayjs(values.last_contact_at as string).toISOString()
            : null,
          next_follow_up_at: values.next_follow_up_at
            ? dayjs(values.next_follow_up_at as string).toISOString()
            : null,
        },
        userOptions,
      )

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, payload)
        message.success('客户更新成功')
      } else {
        await createCustomer(payload)
        message.success('客户创建成功')
      }
      setModalOpen(false)
      actionRef.current?.reload()
      return true
    } catch {
      message.error(editingCustomer ? '客户更新失败' : '客户创建失败')
      return false
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await removeCustomer(id)
      message.success('客户已删除')
      actionRef.current?.reload()
    } catch {
      message.error('删除失败')
    }
  }

  const columns: ProColumns<Customer>[] = [
    {
      title: '客户名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (_, record) => (
        <a onClick={() => navigate(`/customers/${record.id}`)}>{record.name}</a>
      ),
    },
    {
      title: '公司',
      dataIndex: 'company',
      ellipsis: true,
      render: (_, record) => record.company || '-',
    },
    {
      title: '联系人',
      dataIndex: 'contact_name',
      search: false,
      render: (_, record) => record.contact_name || '-',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      render: (_, record) => record.phone || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        potential: { text: '潜在', status: 'Default' },
        following: { text: '跟进中', status: 'Processing' },
        deal: { text: '已成交', status: 'Success' },
        lost: { text: '已流失', status: 'Error' },
      },
      render: (_, record) => {
        const status = record.status ?? 'potential'
        const config = statusMap[status]
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '等级',
      dataIndex: 'level',
      valueType: 'select',
      valueEnum: {
        normal: { text: '普通', status: 'Default' },
        important: { text: '重要', status: 'Warning' },
        vip: { text: 'VIP', status: 'Success' },
      },
      render: (_, record) => {
        const level = record.level ?? 'normal'
        const config = levelMap[level]
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(sourceMap).map(([value, text]) => [
          value,
          { text, status: 'Default' },
        ]),
      ),
      render: (_, record) =>
        record.source ? sourceMap[record.source] : '-',
    },
    {
      title: '负责人',
      dataIndex: 'owner_name',
      search: false,
      render: (_, record) => record.owner_name || '-',
    },
    {
      title: '下次跟进',
      dataIndex: 'next_follow_up_at',
      search: false,
      render: (_, record) =>
        record.next_follow_up_at
          ? dayjs(record.next_follow_up_at).format('YYYY-MM-DD HH:mm')
          : '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      render: (_, record) => [
        <a key="view" onClick={() => navigate(`/customers/${record.id}`)}>
          详情
        </a>,
        <CanAccess key="edit" collection="customers" action="update">
          <a onClick={() => openEditModal(record)}>编辑</a>
        </CanAccess>,
        <CanAccess key="delete" collection="customers" action="delete">
          <Popconfirm
            title="确认删除该客户？关联跟进记录将一并删除"
            onConfirm={() => handleDelete(record.id)}
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </CanAccess>,
      ],
    },
  ]

  const editingInitialValues = editingCustomer
    ? {
        ...editingCustomer,
        last_contact_at: editingCustomer.last_contact_at
          ? dayjs(editingCustomer.last_contact_at)
          : undefined,
        next_follow_up_at: editingCustomer.next_follow_up_at
          ? dayjs(editingCustomer.next_follow_up_at)
          : undefined,
      }
    : {
        status: 'potential' as CustomerStatus,
        level: 'normal' as CustomerLevel,
      }

  return (
    <PageContainer title="客户管理" subTitle="CRM 客户信息与跟进">
      <ProTable<Customer>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        cardBordered
        search={tableSearchConfig}
        request={async (params) => {
          try {
            const result = await listCustomers({
              current: params.current,
              pageSize: params.pageSize,
              name: params.name,
              company: params.company,
              phone: params.phone,
              status: params.status as CustomerStatus | undefined,
              level: params.level as CustomerLevel | undefined,
              source: params.source as CustomerSource | undefined,
            })
            return {
              data: result.data,
              success: true,
              total: result.total,
            }
          } catch {
            message.error('加载客户列表失败')
            return { data: [], success: false, total: 0 }
          }
        }}
        toolBarRender={() => [
          <CanAccess key="create" collection="customers" action="create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              新建客户
            </Button>
          </CanAccess>,
        ]}
      />

      <ModalForm<CustomerInput>
        title={editingCustomer ? '编辑客户' : '新建客户'}
        open={modalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setModalOpen(false),
          width: 640,
        }}
        initialValues={editingInitialValues}
        onFinish={handleSubmit}
      >
        <ProFormText
          name="name"
          label="客户名称"
          placeholder="请输入客户名称"
          rules={[{ required: true, message: '请输入客户名称' }]}
        />
        <ProFormText name="company" label="公司名称" placeholder="请输入公司名称" />
        <ProFormText name="contact_name" label="联系人" placeholder="请输入联系人" />
        <ProFormText name="phone" label="电话" placeholder="请输入联系电话" />
        <ProFormText
          name="email"
          label="邮箱"
          placeholder="请输入邮箱"
          rules={[{ type: 'email', message: '邮箱格式不正确' }]}
        />
        <ProFormSelect name="industry" label="行业" options={industryOptions} />
        <ProFormSelect name="source" label="客户来源" options={sourceOptions} />
        <ProFormSelect name="level" label="客户等级" options={levelOptions} />
        <ProFormSelect name="status" label="客户状态" options={statusOptions} />
        {isAdmin ? (
          <ProFormSelect
            name="owner_id"
            label="负责人"
            options={userOptions}
            placeholder="请选择负责人"
            showSearch
          />
        ) : null}
        <ProFormTextArea name="address" label="地址" placeholder="请输入地址" />
        <ProFormTextArea name="notes" label="备注" placeholder="请输入备注" />
        <ProFormDateTimePicker name="last_contact_at" label="最后联系时间" />
        <ProFormDateTimePicker name="next_follow_up_at" label="下次跟进时间" />
      </ModalForm>
    </PageContainer>
  )
}
