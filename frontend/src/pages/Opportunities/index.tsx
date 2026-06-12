import { PlusOutlined } from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  ModalForm,
  PageContainer,
  ProFormDatePicker,
  ProFormDigit,
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
import { sourceOptions } from '@/constants/customer'
import { stageMap, stageOptions } from '@/constants/opportunity'
import { tableSearchConfig } from '@/constants/table'
import { convertOpportunityToQuote } from '@/services/quotes'
import {
  createOpportunity,
  listContactOptions,
  listCustomerOptions,
  listOpportunities,
  removeOpportunity,
  updateOpportunity,
} from '@/services/opportunities'
import { listUserOptions } from '@/services/user-options'
import { useAuthStore } from '@/stores/auth'
import type {
  OpportunityInput,
  OpportunityListItem,
  OpportunityStage,
} from '@/types/opportunity'
import type { UserOption } from '@/types/user'
import { withOwnerFields } from '@/utils/owner'

function formatAmount(amount?: number | null) {
  if (amount === undefined || amount === null) return '-'
  return `¥${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

export default function OpportunitiesPage() {
  const navigate = useNavigate()
  const isAdmin = useAuthStore((state) => state.isAdmin())
  const actionRef = useRef<ActionType>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOpportunity, setEditingOpportunity] =
    useState<OpportunityListItem | null>(null)
  const [customerOptions, setCustomerOptions] = useState<
    { label: string; value: number }[]
  >([])
  const [contactOptions, setContactOptions] = useState<
    { label: string; value: number }[]
  >([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<
    number | undefined
  >()
  const [userOptions, setUserOptions] = useState<UserOption[]>([])

  useEffect(() => {
    if (!isAdmin) return

    void listUserOptions()
      .then(setUserOptions)
      .catch(() => {
        message.error('加载负责人选项失败')
      })
  }, [isAdmin])

  useEffect(() => {
    void listCustomerOptions()
      .then(setCustomerOptions)
      .catch(() => {
        message.error('加载客户选项失败')
      })
  }, [])

  useEffect(() => {
    void listContactOptions(selectedCustomerId)
      .then(setContactOptions)
      .catch(() => {
        message.error('加载联系人选项失败')
      })
  }, [selectedCustomerId])

  const openCreateModal = () => {
    setEditingOpportunity(null)
    setSelectedCustomerId(undefined)
    setModalOpen(true)
  }

  const openEditModal = (record: OpportunityListItem) => {
    setEditingOpportunity(record)
    setSelectedCustomerId(record.customer_id)
    setModalOpen(true)
  }

  const handleSubmit = async (values: OpportunityInput) => {
    try {
      const payload: OpportunityInput = withOwnerFields(
        {
          ...values,
          customer_id: Number(values.customer_id),
          contact_id: values.contact_id ? Number(values.contact_id) : null,
          amount: values.amount ?? null,
          probability: values.probability ?? null,
          expected_close_date: values.expected_close_date
            ? dayjs(values.expected_close_date as string).format('YYYY-MM-DD')
            : null,
        },
        userOptions,
      )

      if (editingOpportunity) {
        await updateOpportunity(editingOpportunity.id, payload)
        message.success('商机更新成功')
      } else {
        await createOpportunity(payload)
        message.success('商机创建成功')
      }
      setModalOpen(false)
      actionRef.current?.reload()
      return true
    } catch {
      message.error(editingOpportunity ? '商机更新失败' : '商机创建失败')
      return false
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await removeOpportunity(id)
      message.success('商机已删除')
      actionRef.current?.reload()
    } catch {
      message.error('删除失败')
    }
  }

  const handleConvertToQuote = async (record: OpportunityListItem) => {
    try {
      const quote = await convertOpportunityToQuote(record)
      message.success('已转为报价单')
      actionRef.current?.reload()
      navigate(`/quotes/${quote.id}`)
    } catch {
      message.error('转报价失败')
    }
  }

  const columns: ProColumns<OpportunityListItem>[] = [
    {
      title: '商机名称',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: '所属客户',
      dataIndex: 'customer_id',
      valueType: 'select',
      fieldProps: {
        options: customerOptions,
        showSearch: true,
        optionFilterProp: 'label',
      },
      render: (_, record) =>
        record.customer_name ? (
          <a onClick={() => navigate(`/customers/${record.customer_id}`)}>
            {record.customer_name}
          </a>
        ) : (
          '-'
        ),
    },
    {
      title: '对接联系人',
      dataIndex: 'contact_name',
      search: false,
      render: (_, record) => record.contact_name || '-',
    },
    {
      title: '预计金额',
      dataIndex: 'amount',
      search: false,
      render: (_, record) => formatAmount(record.amount),
    },
    {
      title: '销售阶段',
      dataIndex: 'stage',
      valueType: 'select',
      fieldProps: { options: stageOptions },
      render: (_, record) => {
        const stage = record.stage as OpportunityStage | null | undefined
        if (!stage || !stageMap[stage]) return '-'
        const item = stageMap[stage]
        return <Tag color={item.color}>{item.text}</Tag>
      },
    },
    {
      title: '成交概率',
      dataIndex: 'probability',
      search: false,
      render: (_, record) =>
        record.probability !== undefined && record.probability !== null
          ? `${record.probability}%`
          : '-',
    },
    {
      title: '负责人',
      dataIndex: 'owner_name',
      render: (_, record) => record.owner_name || '-',
    },
    {
      title: '预计成交日',
      dataIndex: 'expected_close_date',
      search: false,
      render: (_, record) =>
        record.expected_close_date
          ? dayjs(record.expected_close_date).format('YYYY-MM-DD')
          : '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      render: (_, record) => [
        <CanAccess key="convert" collection="quotes" action="create">
          <Popconfirm
            title="确认将该商机转为报价单？"
            description="将自动创建报价单并推进商机至「方案报价」阶段"
            onConfirm={() => handleConvertToQuote(record)}
          >
            <a>转报价</a>
          </Popconfirm>
        </CanAccess>,
        <CanAccess key="edit" collection="opportunities" action="update">
          <a onClick={() => openEditModal(record)}>编辑</a>
        </CanAccess>,
        <CanAccess key="delete" collection="opportunities" action="delete">
          <Popconfirm
            title="确认删除该商机？"
            onConfirm={() => handleDelete(record.id)}
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </CanAccess>,
      ],
    },
  ]

  const editingInitialValues = editingOpportunity
    ? {
        ...editingOpportunity,
        expected_close_date: editingOpportunity.expected_close_date
          ? dayjs(editingOpportunity.expected_close_date)
          : undefined,
      }
    : {
        stage: 'initial',
        probability: 10,
      }

  return (
    <PageContainer title="商机管理" subTitle="CRM 销售商机跟进">
      <ProTable<OpportunityListItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        cardBordered
        search={tableSearchConfig}
        request={async (params) => {
          try {
            const result = await listOpportunities({
              current: params.current,
              pageSize: params.pageSize,
              name: params.name,
              customer_id: params.customer_id
                ? Number(params.customer_id)
                : undefined,
              stage: params.stage,
              owner_name: params.owner_name,
            })
            return {
              data: result.data,
              success: true,
              total: result.total,
            }
          } catch {
            message.error('加载商机列表失败')
            return { data: [], success: false, total: 0 }
          }
        }}
        toolBarRender={() => [
          <CanAccess key="create" collection="opportunities" action="create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              新建商机
            </Button>
          </CanAccess>,
        ]}
      />

      <ModalForm<OpportunityInput>
        title={editingOpportunity ? '编辑商机' : '新建商机'}
        open={modalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setModalOpen(false),
          width: 640,
        }}
        initialValues={editingInitialValues}
        onFinish={handleSubmit}
      >
        <ProFormSelect
          name="customer_id"
          label="所属客户"
          options={customerOptions}
          showSearch
          fieldProps={{
            optionFilterProp: 'label',
            onChange: (value: number) => {
              setSelectedCustomerId(value)
            },
          }}
          rules={[{ required: true, message: '请选择所属客户' }]}
        />
        <ProFormSelect
          name="contact_id"
          label="对接联系人"
          options={contactOptions}
          showSearch
          fieldProps={{ optionFilterProp: 'label', allowClear: true }}
        />
        <ProFormText
          name="name"
          label="商机名称"
          placeholder="请输入商机名称"
          rules={[{ required: true, message: '请输入商机名称' }]}
        />
        <ProFormDigit
          name="amount"
          label="预计金额"
          placeholder="请输入预计金额"
          min={0}
          fieldProps={{ precision: 2, addonBefore: '¥' }}
        />
        <ProFormSelect
          name="stage"
          label="销售阶段"
          options={stageOptions}
        />
        <ProFormDigit
          name="probability"
          label="成交概率"
          min={0}
          max={100}
          fieldProps={{ addonAfter: '%' }}
        />
        {isAdmin ? (
          <ProFormSelect
            name="owner_id"
            label="负责人"
            options={userOptions}
            placeholder="请选择负责人"
            showSearch
          />
        ) : null}
        <ProFormDatePicker
          name="expected_close_date"
          label="预计成交日"
          fieldProps={{ style: { width: '100%' } }}
        />
        <ProFormSelect name="source" label="商机来源" options={sourceOptions} />
        <ProFormTextArea name="notes" label="备注" placeholder="请输入备注" />
      </ModalForm>
    </PageContainer>
  )
}
