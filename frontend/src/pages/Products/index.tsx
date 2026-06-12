import { PlusOutlined } from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components'
import { Button, message, Popconfirm, Tag } from 'antd'
import { useRef, useState } from 'react'
import CanAccess from '@/components/CanAccess'
import {
  createProduct,
  listProducts,
  removeProduct,
  updateProduct,
} from '@/services/products'
import type { Product, ProductInput, ProductStatus } from '@/types/product'
import { tableSearchConfig } from '@/constants/table'

const statusMap: Record<
  ProductStatus,
  { text: string; color: string }
> = {
  draft: { text: '草稿', color: 'default' },
  published: { text: '上架', color: 'success' },
  archived: { text: '下架', color: 'warning' },
}

const statusOptions = Object.entries(statusMap).map(([value, item]) => ({
  label: item.text,
  value,
}))

export default function ProductsPage() {
  const actionRef = useRef<ActionType>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const openCreateModal = () => {
    setEditingProduct(null)
    setModalOpen(true)
  }

  const openEditModal = (record: Product) => {
    setEditingProduct(record)
    setModalOpen(true)
  }

  const handleSubmit = async (values: ProductInput) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, values)
        message.success('产品更新成功')
      } else {
        await createProduct(values)
        message.success('产品创建成功')
      }
      setModalOpen(false)
      actionRef.current?.reload()
      return true
    } catch {
      message.error(editingProduct ? '产品更新失败' : '产品创建失败')
      return false
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await removeProduct(id)
      message.success('产品已删除')
      actionRef.current?.reload()
    } catch {
      message.error('删除失败')
    }
  }

  const columns: ProColumns<Product>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '产品名称',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      search: false,
      render: (_, record) => record.sku || '-',
    },
    {
      title: '价格',
      dataIndex: 'price',
      search: false,
      render: (_, record) =>
        record.price != null ? `¥${Number(record.price).toFixed(2)}` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        draft: { text: '草稿', status: 'Default' },
        published: { text: '上架', status: 'Success' },
        archived: { text: '下架', status: 'Warning' },
      },
      render: (_, record) => {
        const status = record.status ?? 'draft'
        const config = statusMap[status]
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      search: false,
      ellipsis: true,
      render: (_, record) => record.description || '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      render: (_, record) => [
        <CanAccess key="edit" collection="products" action="update">
          <a onClick={() => openEditModal(record)}>编辑</a>
        </CanAccess>,
        <CanAccess key="delete" collection="products" action="delete">
          <Popconfirm
            title="确认删除该产品？"
            onConfirm={() => handleDelete(record.id)}
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </CanAccess>,
      ],
    },
  ]

  return (
    <PageContainer title="产品管理" subTitle="管理 Directus products 集合">
      <ProTable<Product>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        cardBordered
        search={tableSearchConfig}
        request={async (params) => {
          try {
            const result = await listProducts({
              current: params.current,
              pageSize: params.pageSize,
              name: params.name,
              status: params.status as ProductStatus | undefined,
            })
            return {
              data: result.data,
              success: true,
              total: result.total,
            }
          } catch {
            message.error('加载产品列表失败')
            return { data: [], success: false, total: 0 }
          }
        }}
        toolBarRender={() => [
          <CanAccess key="create" collection="products" action="create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              新建产品
            </Button>
          </CanAccess>,
        ]}
      />

      <ModalForm<ProductInput>
        title={editingProduct ? '编辑产品' : '新建产品'}
        open={modalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setModalOpen(false),
        }}
        initialValues={
          editingProduct ?? {
            status: 'draft',
            price: 0,
          }
        }
        onFinish={handleSubmit}
      >
        <ProFormText
          name="name"
          label="产品名称"
          placeholder="请输入产品名称"
          rules={[{ required: true, message: '请输入产品名称' }]}
        />
        <ProFormText
          name="sku"
          label="SKU"
          placeholder="请输入 SKU 编号"
        />
        <ProFormDigit
          name="price"
          label="价格"
          min={0}
          fieldProps={{ precision: 2 }}
          rules={[{ required: true, message: '请输入价格' }]}
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={statusOptions}
          rules={[{ required: true, message: '请选择状态' }]}
        />
        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="请输入产品描述"
        />
      </ModalForm>
    </PageContainer>
  )
}
