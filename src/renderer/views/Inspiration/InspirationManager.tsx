import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Input, Button, List, Modal, Form, Tag, Space, message, Empty } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined, BulbOutlined } from '@ant-design/icons'
import { inspirationApi, type Inspiration } from '../../api'

function InspirationManager(): JSX.Element {
  const { projectId } = useParams()
  const [inspirations, setInspirations] = useState<Inspiration[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingInspiration, setEditingInspiration] = useState<Inspiration | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [form] = Form.useForm()

  useEffect(() => {
    if (projectId) {
      loadInspirations()
    }
  }, [projectId])

  const loadInspirations = async (): Promise<void> => {
    if (!projectId) return
    setLoading(true)
    try {
      const data = await inspirationApi.list(projectId)
      setInspirations(data)
    } catch (error) {
      message.error('加载灵感失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = (): void => {
    form.resetFields()
    setEditingInspiration(null)
    setIsModalVisible(true)
  }

  const handleEdit = (inspiration: Inspiration): void => {
    setEditingInspiration(inspiration)
    form.setFieldsValue({
      content: inspiration.content,
      tags: inspiration.tags.join(', ')
    })
    setIsModalVisible(true)
  }

  const handleSave = async (): Promise<void> => {
    if (!projectId) return
    const values = await form.validateFields()
    const tags = values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []

    try {
      if (editingInspiration) {
        await inspirationApi.update(editingInspiration.id, values.content, tags)
        message.success('灵感已更新')
      } else {
        await inspirationApi.add(projectId, values.content, tags)
        message.success('灵感已添加')
      }
      setIsModalVisible(false)
      loadInspirations()
    } catch (error) {
      message.error('保存灵感失败')
    }
  }

  const handleDelete = async (id: number): Promise<void> => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条灵感吗？',
      onOk: async () => {
        try {
          await inspirationApi.delete(id)
          message.success('灵感已删除')
          loadInspirations()
        } catch (error) {
          message.error('删除灵感失败')
        }
      }
    })
  }

  const handleSearch = async (): Promise<void> => {
    if (!projectId || !searchKeyword.trim()) {
      loadInspirations()
      return
    }
    try {
      const results = await inspirationApi.search(projectId, searchKeyword)
      setInspirations(results)
    } catch (error) {
      message.error('搜索失败')
    }
  }

  const filteredInspirations = searchKeyword.trim()
    ? inspirations
    : inspirations

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>
          <BulbOutlined style={{ marginRight: 8 }} />
          灵感库
        </h2>
        <Space>
          <Input.Search
            placeholder="搜索灵感..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 200 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加灵感
          </Button>
        </Space>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {filteredInspirations.length === 0 ? (
          <Empty description="暂无灵感，点击添加开始记录" />
        ) : (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
            dataSource={filteredInspirations}
            renderItem={(inspiration) => (
              <List.Item>
                <Card
                  hoverable
                  actions={[
                    <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(inspiration)}>
                      编辑
                    </Button>,
                    <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(inspiration.id)}>
                      删除
                    </Button>
                  ]}
                >
                  <Card.Meta
                    description={
                      <div>
                        <p style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                          marginBottom: 8
                        }}>
                          {inspiration.content}
                        </p>
                        {inspiration.tags && inspiration.tags.length > 0 && (
                          <div>
                            {inspiration.tags.map((tag, index) => (
                              <Tag key={index} color="blue">{tag}</Tag>
                            ))}
                          </div>
                        )}
                        <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                          {new Date(inspiration.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        )}
      </div>

      <Modal
        title={editingInspiration ? '编辑灵感' : '添加灵感'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSave}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="content"
            label="灵感内容"
            rules={[{ required: true, message: '请输入灵感内容' }]}
          >
            <Input.TextArea rows={6} placeholder="记录你的灵感..." />
          </Form.Item>
          <Form.Item name="tags" label="标签（用逗号分隔）">
            <Input placeholder="如：场景, 角色, 道具" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default InspirationManager
