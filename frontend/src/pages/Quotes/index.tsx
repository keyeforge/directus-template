import { PlusOutlined } from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  ModalForm,
  PageContainer,
  ProFormDatePicker,
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
import { quoteStatusMap, quoteStatusOptions } from '@/constants/quote'
import { tableSearchConfig } from '@/constants/table'
import {
  convertQuoteToOpportunity,
  createQuote,
  generateQuoteNo,
  listCustomerOptions,
  listQuotes,
  removeQuote,
} from '@/services/quotes'
import { listUserOptions } from '@/services/user-options'
import { useAuthStore } from '@/stores/auth'
import type { QuoteInput, QuoteListItem, QuoteStatus } from '@/types/quote'
import type { UserOption } from '@/types/user'
import { withOwnerFields } from '@/utils/owner'

function formatAmount(amount?: number | null) {
  if (amount === undefined || amount === null) return '-'
  return `¥${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

export default function QuotesPage() {
  const navigate = useNavigate()
  const isAdmin = useAuthStore((state) => state.isAdmin())
  const actionRef = useRef<ActionType>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [customerOptions, setCustomerOptions] = useState<
    { label: string; value: number }[]
  >([])
  const [userOptions, setUserOptions] = useState<UserOption[]>([])

  useEffect(() => {
    void listCustomerOptions()
      .then(setCustomerOptions)
      .catch(() => {
        message.error('加载客户选项失败')
      })
  }, [])

  useEffect(() => {
    if (!isAdmin) return

    void listUserOptions()
      .then(setUserOptions)
      .catch(() => {
        message.error('加载负责人选项失败')
      })
  }, [isAdmin])

  const handleSubmit = async (values: QuoteInput) => {
    try {
      const payload: QuoteInput = withOwnerFields(
        {
          ...values,
          customer_id: Number(values.customer_id),
          valid_until: values.valid_until
            ? dayjs(values.valid_until as string).format('YYYY-MM-DD')
            : null,
        },
        userOptions,
      )
      const quote = await createQuote(payload)
      message.success('报价单创建成功')
      setModalOpen(false)
      actionRef.current?.reload()
      navigate(`/quotes/${quote.id}`)
      return true
    } catch {
      message.error('报价单创建失败')
      return false
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await removeQuote(id)
      message.success('报价单已删除')
      actionRef.current?.reload()
    } catch {
      message.error('删除失败')
    }
  }

  const handleConvertToOpportunity = async (record: QuoteListItem) => {
    try {
      await convertQuoteToOpportunity(record)
      message.success('已转为商机')
      actionRef.current?.reload()
      navigate('/opportunities')
    } catch {
      message.error('转商机失败')
    }
  }

  const columns: ProColumns<QuoteListItem>[] = [
    {
      title: '报价单号',
      dataIndex: 'quote_no',
      render: (_, record) => (
        <a onClick={() => navigate(`/quotes/${record.id}`)}>{record.quote_no}</a>
      ),
    },
    {
      title: '报价标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '关联商机',
      dataIndex: 'opportunity_name',
      search: false,
      render: (_, record) => record.opportunity_name || '-',
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
      title: '总金额',
      dataIndex: 'total_amount',
      search: false,
      render: (_, record) => formatAmount(record.total_amount),
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      fieldProps: { options: quoteStatusOptions },
      render: (_, record) => {
        const status = record.status as QuoteStatus | null | undefined
        if (!status || !quoteStatusMap[status]) return '-'
        const item = quoteStatusMap[status]
        return <Tag color={item.color}>{item.text}</Tag>
      },
    },
    {
      title: '负责人',
      dataIndex: 'owner_name',
      render: (_, record) => record.owner_name || '-',
    },
    {
      title: '有效期至',
      dataIndex: 'valid_until',
      search: false,
      render: (_, record) =>
        record.valid_until
          ? dayjs(record.valid_until).format('YYYY-MM-DD')
          : '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      render: (_, record) => [
        ...(!record.opportunity_id
          ? [
              <CanAccess key="convert" collection="opportunities" action="create">
                <Popconfirm
                  title="确认将该报价单转为商机？"
                  description="将自动创建商机并关联本报价单，阶段设为「方案报价」"
                  onConfirm={() => handleConvertToOpportunity(record)}
                >
                  <a>转商机</a>
                </Popconfirm>
              </CanAccess>,
            ]
          : []),
        <a key="view" onClick={() => navigate(`/quotes/${record.id}`)}>
          查看
        </a>,
        <CanAccess key="delete" collection="quotes" action="delete">
          <Popconfirm
            title="确认删除该报价单？明细将一并删除"
            onConfirm={() => handleDelete(record.id)}
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </CanAccess>,
      ],
    },
  ]

  return (
    <PageContainer title="报价管理" subTitle="CRM 销售报价单">
      <ProTable<QuoteListItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        cardBordered
        search={tableSearchConfig}
        request={async (params) => {
          try {
            const result = await listQuotes({
              current: params.current,
              pageSize: params.pageSize,
              quote_no: params.quote_no,
              title: params.title,
              customer_id: params.customer_id
                ? Number(params.customer_id)
                : undefined,
              status: params.status,
              owner_name: params.owner_name,
            })
            return {
              data: result.data,
              success: true,
              total: result.total,
            }
          } catch {
            message.error('加载报价列表失败')
            return { data: [], success: false, total: 0 }
          }
        }}
        toolBarRender={() => [
          <CanAccess key="create" collection="quotes" action="create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              新建报价
            </Button>
          </CanAccess>,
        ]}
      />

      <ModalForm<QuoteInput>
        title="新建报价"
        open={modalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setModalOpen(false),
          width: 640,
        }}
        initialValues={{
          quote_no: generateQuoteNo(),
          status: 'draft',
          valid_until: dayjs().add(30, 'day'),
        }}
        onFinish={handleSubmit}
      >
        <ProFormText
          name="quote_no"
          label="报价单号"
          rules={[{ required: true, message: '请输入报价单号' }]}
        />
        <ProFormSelect
          name="customer_id"
          label="所属客户"
          options={customerOptions}
          showSearch
          fieldProps={{ optionFilterProp: 'label' }}
          rules={[{ required: true, message: '请选择所属客户' }]}
        />
        <ProFormText
          name="title"
          label="报价标题"
          placeholder="请输入报价标题"
          rules={[{ required: true, message: '请输入报价标题' }]}
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={quoteStatusOptions}
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
          name="valid_until"
          label="有效期至"
          fieldProps={{ style: { width: '100%' } }}
        />
        <ProFormTextArea name="notes" label="备注" placeholder="请输入备注" />
      </ModalForm>
    </PageContainer>
  )
}
