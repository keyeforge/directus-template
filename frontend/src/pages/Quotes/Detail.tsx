import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  ModalForm,
  PageContainer,
  ProDescriptions,
  ProFormDatePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components'
import { Button, Form, message, Popconfirm, Result, Spin, Tag } from 'antd'
import CanAccess from '@/components/CanAccess'
import dayjs from 'dayjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { quoteStatusMap, quoteStatusOptions } from '@/constants/quote'
import {
  convertQuoteToOpportunity,
  createQuoteItem,
  getQuote,
  listProductOptions,
  removeQuoteItem,
  updateQuote,
  updateQuoteItem,
} from '@/services/quotes'
import { listUserOptions } from '@/services/user-options'
import { useAuthStore } from '@/stores/auth'
import type {
  QuoteDetail,
  QuoteInput,
  QuoteItem,
  QuoteItemInput,
  QuoteStatus,
} from '@/types/quote'
import type { UserOption } from '@/types/user'
import { isForbiddenError } from '@/utils/directus-error'
import { withOwnerFields } from '@/utils/owner'

function formatAmount(amount?: number | null) {
  if (amount === undefined || amount === null) return '-'
  return `¥${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const quoteId = Number(id)
  const navigate = useNavigate()
  const isAdmin = useAuthStore((state) => state.isAdmin())
  const itemActionRef = useRef<ActionType>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null)
  const [productOptions, setProductOptions] = useState<
    { label: string; value: number; price?: number | null }[]
  >([])
  const [itemForm] = Form.useForm<QuoteItemInput>()
  const [userOptions, setUserOptions] = useState<UserOption[]>([])

  const loadQuote = useCallback(async () => {
    if (!Number.isFinite(quoteId)) return
    setLoading(true)
    setForbidden(false)
    try {
      const data = await getQuote(quoteId)
      setQuote(data)
    } catch (error) {
      if (isForbiddenError(error)) {
        setForbidden(true)
        setQuote(null)
      } else {
        message.error('加载报价详情失败')
        setQuote(null)
      }
    } finally {
      setLoading(false)
    }
  }, [quoteId])

  useEffect(() => {
    void loadQuote()
  }, [loadQuote])

  useEffect(() => {
    if (!isAdmin) return

    void Promise.all([listProductOptions(), listUserOptions()])
      .then(([products, users]) => {
        setProductOptions(products)
        setUserOptions(users)
      })
      .catch(() => {
        message.error('加载表单选项失败')
      })
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) return

    void listProductOptions()
      .then(setProductOptions)
      .catch(() => {
        message.error('加载产品选项失败')
      })
  }, [isAdmin])

  const handleUpdateQuote = async (values: QuoteInput) => {
    if (!quote) return false
    try {
      await updateQuote(
        quote.id,
        withOwnerFields(
          {
            ...values,
            valid_until: values.valid_until
              ? dayjs(values.valid_until as string).format('YYYY-MM-DD')
              : null,
          },
          userOptions,
        ),
      )
      message.success('报价单已更新')
      setEditModalOpen(false)
      void loadQuote()
      return true
    } catch {
      message.error('更新失败')
      return false
    }
  }

  const handleSubmitItem = async (values: QuoteItemInput) => {
    if (!quote) return false
    try {
      const quantity = Number(values.quantity ?? 1)
      const unitPrice = Number(values.unit_price ?? 0)
      const payload: QuoteItemInput = {
        ...values,
        quote_id: quote.id,
        product_id: values.product_id ? Number(values.product_id) : null,
        quantity,
        unit_price: unitPrice,
        amount: quantity * unitPrice,
      }

      if (editingItem) {
        await updateQuoteItem(editingItem.id, payload)
        message.success('明细已更新')
      } else {
        await createQuoteItem(payload)
        message.success('明细已添加')
      }

      setItemModalOpen(false)
      setEditingItem(null)
      itemActionRef.current?.reload()
      void loadQuote()
      return true
    } catch {
      message.error(editingItem ? '更新明细失败' : '添加明细失败')
      return false
    }
  }

  const handleDeleteItem = async (itemId: number) => {
    try {
      await removeQuoteItem(itemId)
      message.success('明细已删除')
      itemActionRef.current?.reload()
      void loadQuote()
    } catch {
      message.error('删除失败')
    }
  }

  const handleConvertToOpportunity = async () => {
    if (!quote) return
    try {
      await convertQuoteToOpportunity(quote)
      message.success('已转为商机')
      navigate('/opportunities')
    } catch {
      message.error('转商机失败')
    }
  }

  if (!Number.isFinite(quoteId)) {
    return (
      <PageContainer>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/quotes')}
        >
          返回列表
        </Button>
        <p>无效的报价 ID</p>
      </PageContainer>
    )
  }

  const itemColumns: ProColumns<QuoteItem>[] = [
    {
      title: '产品/服务',
      dataIndex: 'item_name',
      ellipsis: true,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 100,
      render: (_, record) => record.quantity ?? '-',
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      width: 120,
      render: (_, record) => formatAmount(record.unit_price),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      render: (_, record) => formatAmount(record.amount),
    },
    {
      title: '备注',
      dataIndex: 'notes',
      ellipsis: true,
      render: (_, record) => record.notes || '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 140,
      render: (_, record) => [
        <CanAccess key="edit" collection="quote_items" action="update">
          <a
            onClick={() => {
              setEditingItem(record)
              setItemModalOpen(true)
            }}
          >
            编辑
          </a>
        </CanAccess>,
        <CanAccess key="delete" collection="quote_items" action="delete">
          <Popconfirm
            title="确认删除该明细？"
            onConfirm={() => handleDeleteItem(record.id)}
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </CanAccess>,
      ],
    },
  ]

  const status = quote?.status as QuoteStatus | null | undefined
  const statusConfig = status && quoteStatusMap[status]

  return (
    <PageContainer
      title={quote?.title ?? '报价详情'}
      subTitle={quote?.quote_no}
      onBack={() => navigate('/quotes')}
      extra={
        quote ? (
          <>
            {!quote.opportunity_id && (
              <CanAccess collection="opportunities" action="create">
                <Popconfirm
                  title="确认将该报价单转为商机？"
                  description="将自动创建商机并关联本报价单，阶段设为「方案报价」"
                  onConfirm={() => handleConvertToOpportunity()}
                >
                  <Button>转商机</Button>
                </Popconfirm>
              </CanAccess>
            )}
            <CanAccess collection="quotes" action="update">
              <Button type="primary" onClick={() => setEditModalOpen(true)}>
                编辑报价
              </Button>
            </CanAccess>
          </>
        ) : undefined
      }
    >
      <Spin spinning={loading}>
        {quote ? (
          <>
            <ProDescriptions
              column={2}
              bordered
              dataSource={quote}
              columns={[
                { title: '报价单号', dataIndex: 'quote_no' },
                { title: '报价标题', dataIndex: 'title' },
                {
                  title: '关联商机',
                  dataIndex: 'opportunity_name',
                  render: (_, record) => record.opportunity_name || '-',
                },
                {
                  title: '所属客户',
                  dataIndex: 'customer_name',
                  render: (_, record) => record.customer_name || '-',
                },
                {
                  title: '对接联系人',
                  dataIndex: 'contact_name',
                  render: (_, record) => record.contact_name || '-',
                },
                {
                  title: '总金额',
                  dataIndex: 'total_amount',
                  render: (_, record) => formatAmount(record.total_amount),
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: () =>
                    statusConfig ? (
                      <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
                    ) : (
                      '-'
                    ),
                },
                {
                  title: '负责人',
                  dataIndex: 'owner_name',
                  render: (_, record) => record.owner_name || '-',
                },
                {
                  title: '有效期至',
                  dataIndex: 'valid_until',
                  render: (_, record) =>
                    record.valid_until
                      ? dayjs(record.valid_until).format('YYYY-MM-DD')
                      : '-',
                },
                {
                  title: '备注',
                  dataIndex: 'notes',
                  span: 2,
                  render: (_, record) => record.notes || '-',
                },
              ]}
            />

            <ProTable<QuoteItem>
              style={{ marginTop: 24 }}
              headerTitle="报价明细"
              rowKey="id"
              actionRef={itemActionRef}
              columns={itemColumns}
              search={false}
              pagination={false}
              dataSource={quote.items}
              toolBarRender={() => [
                <CanAccess key="add" collection="quote_items" action="create">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingItem(null)
                      setItemModalOpen(true)
                    }}
                  >
                    添加明细
                  </Button>
                </CanAccess>,
              ]}
            />
          </>
        ) : (
          !loading && forbidden ? (
            <Result status="403" title="403" subTitle="你没有权限查看此报价单" />
          ) : (
            !loading && <p>报价单不存在或已被删除</p>
          )
        )}
      </Spin>

      <ModalForm<QuoteInput>
        title="编辑报价"
        open={editModalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setEditModalOpen(false),
          width: 640,
        }}
        initialValues={
          quote
            ? {
                ...quote,
                valid_until: quote.valid_until
                  ? dayjs(quote.valid_until)
                  : undefined,
              }
            : undefined
        }
        onFinish={handleUpdateQuote}
      >
        <ProFormText name="title" label="报价标题" rules={[{ required: true }]} />
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
            showSearch
          />
        ) : null}
        <ProFormDatePicker
          name="valid_until"
          label="有效期至"
          fieldProps={{ style: { width: '100%' } }}
        />
        <ProFormTextArea name="notes" label="备注" />
      </ModalForm>

      <ModalForm<QuoteItemInput>
        title={editingItem ? '编辑明细' : '添加明细'}
        form={itemForm}
        open={itemModalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => {
            setItemModalOpen(false)
            setEditingItem(null)
          },
          width: 640,
        }}
        initialValues={
          editingItem ?? {
            quantity: 1,
            unit_price: 0,
          }
        }
        onFinish={handleSubmitItem}
      >
        <ProFormSelect
          name="product_id"
          label="关联产品"
          options={productOptions}
          showSearch
          fieldProps={{
            optionFilterProp: 'label',
            allowClear: true,
            onChange: (value: number) => {
              const product = productOptions.find((item) => item.value === value)
              if (product) {
                itemForm.setFieldsValue({
                  item_name: product.label,
                  unit_price: product.price ?? 0,
                })
              }
            },
          }}
        />
        <ProFormText
          name="item_name"
          label="产品/服务名称"
          rules={[{ required: true, message: '请输入名称' }]}
        />
        <ProFormDigit
          name="quantity"
          label="数量"
          min={0}
          fieldProps={{ precision: 2 }}
          rules={[{ required: true, message: '请输入数量' }]}
        />
        <ProFormDigit
          name="unit_price"
          label="单价"
          min={0}
          fieldProps={{ precision: 2, addonBefore: '¥' }}
          rules={[{ required: true, message: '请输入单价' }]}
        />
        <ProFormTextArea name="notes" label="备注" />
      </ModalForm>
    </PageContainer>
  )
}
