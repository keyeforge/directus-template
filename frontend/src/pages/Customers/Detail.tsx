import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  ModalForm,
  PageContainer,
  ProDescriptions,
  ProFormDateTimePicker,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components'
import { Button, message, Popconfirm, Result, Spin, Tag } from 'antd'
import CanAccess from '@/components/CanAccess'
import dayjs from 'dayjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  followUpTypeMap,
  followUpTypeOptions,
  industryMap,
  levelMap,
  sourceMap,
  statusMap,
} from '@/constants/customer'
import {
  createCustomerFollowUp,
  listCustomerFollowUps,
  removeCustomerFollowUp,
} from '@/services/customer-follow-ups'
import { getCustomer, updateCustomer } from '@/services/customers'
import type { Customer, CustomerFollowUp, CustomerFollowUpInput } from '@/types/customer'
import { isForbiddenError } from '@/utils/directus-error'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const customerId = Number(id)
  const navigate = useNavigate()
  const followUpActionRef = useRef<ActionType>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false)

  const loadCustomer = useCallback(async () => {
    if (!Number.isFinite(customerId)) return
    setLoading(true)
    setForbidden(false)
    try {
      const data = await getCustomer(customerId)
      setCustomer(data)
    } catch (error) {
      if (isForbiddenError(error)) {
        setForbidden(true)
        setCustomer(null)
      } else {
        message.error('加载客户详情失败')
        setCustomer(null)
      }
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    void loadCustomer()
  }, [loadCustomer])

  const handleAddFollowUp = async (values: CustomerFollowUpInput) => {
    if (!customer) return false
    try {
      const followUpAt = values.follow_up_at
        ? dayjs(values.follow_up_at as string).toISOString()
        : dayjs().toISOString()

      await createCustomerFollowUp({
        ...values,
        customer_id: customer.id,
        follow_up_at: followUpAt,
      })

      await updateCustomer(customer.id, {
        last_contact_at: followUpAt,
      })

      message.success('跟进记录已添加')
      setFollowUpModalOpen(false)
      followUpActionRef.current?.reload()
      void loadCustomer()
      return true
    } catch {
      message.error('添加跟进记录失败')
      return false
    }
  }

  const handleDeleteFollowUp = async (followUpId: number) => {
    try {
      await removeCustomerFollowUp(followUpId)
      message.success('跟进记录已删除')
      followUpActionRef.current?.reload()
    } catch {
      message.error('删除失败')
    }
  }

  if (!Number.isFinite(customerId)) {
    return (
      <PageContainer>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/customers')}>
          返回列表
        </Button>
        <p>无效的客户 ID</p>
      </PageContainer>
    )
  }

  const followUpColumns: ProColumns<CustomerFollowUp>[] = [
    {
      title: '跟进时间',
      dataIndex: 'follow_up_at',
      width: 180,
      render: (_, record) =>
        record.follow_up_at
          ? dayjs(record.follow_up_at).format('YYYY-MM-DD HH:mm')
          : '-',
    },
    {
      title: '方式',
      dataIndex: 'follow_up_type',
      width: 100,
      render: (_, record) => {
        const type = record.follow_up_type ?? 'other'
        return followUpTypeMap[type]
      },
    },
    {
      title: '跟进内容',
      dataIndex: 'content',
      ellipsis: true,
    },
    {
      title: '下一步计划',
      dataIndex: 'next_action',
      ellipsis: true,
      render: (_, record) => record.next_action || '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      render: (_, record) => [
        <CanAccess key="delete" collection="customer_follow_ups" action="delete">
          <Popconfirm
            title="确认删除该跟进记录？"
            onConfirm={() => handleDeleteFollowUp(record.id)}
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </CanAccess>,
      ],
    },
  ]

  return (
    <PageContainer
      title={customer?.name ?? '客户详情'}
      subTitle={customer?.company ?? undefined}
      onBack={() => navigate('/customers')}
    >
      <Spin spinning={loading}>
        {customer ? (
          <>
            <ProDescriptions<Customer>
              column={2}
              bordered
              title="基本信息"
              dataSource={customer}
              columns={[
                { title: '客户名称', dataIndex: 'name' },
                { title: '公司', dataIndex: 'company', render: (_, r) => r.company || '-' },
                { title: '联系人', dataIndex: 'contact_name', render: (_, r) => r.contact_name || '-' },
                { title: '电话', dataIndex: 'phone', render: (_, r) => r.phone || '-' },
                { title: '邮箱', dataIndex: 'email', render: (_, r) => r.email || '-' },
                {
                  title: '行业',
                  dataIndex: 'industry',
                  render: (_, r) => (r.industry ? industryMap[r.industry] : '-'),
                },
                {
                  title: '来源',
                  dataIndex: 'source',
                  render: (_, r) => (r.source ? sourceMap[r.source] : '-'),
                },
                {
                  title: '等级',
                  dataIndex: 'level',
                  render: (_, r) => {
                    const level = r.level ?? 'normal'
                    const config = levelMap[level]
                    return <Tag color={config.color}>{config.text}</Tag>
                  },
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: (_, r) => {
                    const status = r.status ?? 'potential'
                    const config = statusMap[status]
                    return <Tag color={config.color}>{config.text}</Tag>
                  },
                },
                { title: '负责人', dataIndex: 'owner_name', render: (_, r) => r.owner_name || '-' },
                {
                  title: '最后联系',
                  dataIndex: 'last_contact_at',
                  render: (_, r) =>
                    r.last_contact_at
                      ? dayjs(r.last_contact_at).format('YYYY-MM-DD HH:mm')
                      : '-',
                },
                {
                  title: '下次跟进',
                  dataIndex: 'next_follow_up_at',
                  render: (_, r) =>
                    r.next_follow_up_at
                      ? dayjs(r.next_follow_up_at).format('YYYY-MM-DD HH:mm')
                      : '-',
                },
                {
                  title: '地址',
                  dataIndex: 'address',
                  span: 2,
                  render: (_, r) => r.address || '-',
                },
                {
                  title: '备注',
                  dataIndex: 'notes',
                  span: 2,
                  render: (_, r) => r.notes || '-',
                },
              ]}
            />

            <ProTable<CustomerFollowUp>
              style={{ marginTop: 24 }}
              headerTitle="跟进记录"
              rowKey="id"
              actionRef={followUpActionRef}
              columns={followUpColumns}
              search={false}
              pagination={{ pageSize: 10 }}
              toolBarRender={() => [
                <CanAccess
                  key="add"
                  collection="customer_follow_ups"
                  action="create"
                >
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setFollowUpModalOpen(true)}
                  >
                    添加跟进
                  </Button>
                </CanAccess>,
              ]}
              request={async () => {
                try {
                  const data = await listCustomerFollowUps(customerId)
                  return { data, success: true, total: data.length }
                } catch {
                  message.error('加载跟进记录失败')
                  return { data: [], success: false, total: 0 }
                }
              }}
            />
          </>
        ) : forbidden ? (
          <Result status="403" title="403" subTitle="你没有权限查看此客户" />
        ) : (
          !loading && <p>客户不存在或已被删除</p>
        )}
      </Spin>

      <ModalForm<CustomerFollowUpInput>
        title="添加跟进记录"
        open={followUpModalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setFollowUpModalOpen(false),
        }}
        initialValues={{
          follow_up_type: 'call',
          follow_up_at: dayjs(),
        }}
        onFinish={handleAddFollowUp}
      >
        <ProFormSelect
          name="follow_up_type"
          label="跟进方式"
          options={followUpTypeOptions}
          rules={[{ required: true, message: '请选择跟进方式' }]}
        />
        <ProFormDateTimePicker
          name="follow_up_at"
          label="跟进时间"
          rules={[{ required: true, message: '请选择跟进时间' }]}
        />
        <ProFormTextArea
          name="content"
          label="跟进内容"
          placeholder="请输入本次跟进内容"
          rules={[{ required: true, message: '请输入跟进内容' }]}
        />
        <ProFormText name="next_action" label="下一步计划" placeholder="可选" />
      </ModalForm>
    </PageContainer>
  )
}
