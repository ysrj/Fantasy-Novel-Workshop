import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tabs, Input, Button, Space, message, Modal, Form, Select, Table, Tag as AntTag, Row, Col, Card, Empty, Popconfirm, Drawer, List, Typography, Divider, Spin } from 'antd'
import { PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined, FolderOutlined, FileTextOutlined, ApiOutlined, LinkOutlined, ReloadOutlined, ExportOutlined, ImportOutlined, SettingOutlined, BookOutlined } from '@ant-design/icons'
import { knowledgeApi, type KnowledgeCollection, type KnowledgeEntry, type ExternalKnowledgeConfig } from '../../api/knowledgeApi'

const { TextArea } = Input
const { Text, Paragraph } = Typography

function KnowledgeBase(): JSX.Element {
  const { projectId } = useParams()
  const navigate = useNavigate()
  
  const [collections, setCollections] = useState<KnowledgeCollection[]>([])
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [selectedCollection, setSelectedCollection] = useState<KnowledgeCollection | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [collectionModalVisible, setCollectionModalVisible] = useState(false)
  const [entryModalVisible, setEntryModalVisible] = useState(false)
  const [externalConfigVisible, setExternalConfigVisible] = useState(false)
  const [editingCollection, setEditingCollection] = useState<KnowledgeCollection | null>(null)
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null)
  const [externalConfig, setExternalConfig] = useState<ExternalKnowledgeConfig | null>(null)
  const [collectionForm] = Form.useForm()
  const [entryForm] = Form.useForm()
  const [externalForm] = Form.useForm()
  const [activeTab, setActiveTab] = useState('collections')

  useEffect(() => {
    if (projectId) {
      loadCollections()
      loadExternalConfig()
    }
  }, [projectId])

  useEffect(() => {
    if (selectedCollection) {
      loadEntries(selectedCollection.id)
    }
  }, [selectedCollection])

  const loadCollections = async (): Promise<void> => {
    if (!projectId) return
    try {
      const data = await knowledgeApi.listCollections(projectId)
      setCollections(data || [])
    } catch (error) {
      message.error('加载知识库失败')
    }
  }

  const loadEntries = async (collectionId: string): Promise<void> => {
    try {
      const data = await knowledgeApi.getEntries(collectionId)
      setEntries(data || [])
    } catch (error) {
      message.error('加载条目失败')
    }
  }

  const loadExternalConfig = async (): Promise<void> => {
    try {
      const config = await knowledgeApi.getExternalConfig()
      setExternalConfig(config)
      if (config) externalForm.setFieldsValue(config)
    } catch (error) {
      console.error('Failed to load external config:', error)
    }
  }

  const handleCreateCollection = async (): Promise<void> => {
    const values = await collectionForm.validateFields()
    if (!projectId) return
    try {
      await knowledgeApi.createCollection(projectId, values.name, values.description, values.type)
      message.success('创建成功')
      setCollectionModalVisible(false)
      collectionForm.resetFields()
      loadCollections()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const handleUpdateCollection = async (): Promise<void> => {
    if (!editingCollection) return
    const values = await collectionForm.validateFields()
    try {
      await knowledgeApi.updateCollection(editingCollection.id, values)
      message.success('更新成功')
      setCollectionModalVisible(false)
      collectionForm.resetFields()
      setEditingCollection(null)
      loadCollections()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handleDeleteCollection = async (id: string): Promise<void> => {
    try {
      await knowledgeApi.deleteCollection(id)
      message.success('删除成功')
      if (selectedCollection?.id === id) {
        setSelectedCollection(null)
        setEntries([])
      }
      loadCollections()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleCreateEntry = async (): Promise<void> => {
    const values = await entryForm.validateFields()
    if (!selectedCollection) return
    try {
      await knowledgeApi.createEntry(selectedCollection.id, values.title, values.content, values.tags || [])
      message.success('创建成功')
      setEntryModalVisible(false)
      entryForm.resetFields()
      loadEntries(selectedCollection.id)
    } catch (error) {
      message.error('创建失败')
    }
  }

  const handleUpdateEntry = async (): Promise<void> => {
    if (!editingEntry) return
    const values = await entryForm.validateFields()
    try {
      await knowledgeApi.updateEntry(editingEntry.id, values)
      message.success('更新成功')
      setEntryModalVisible(false)
      entryForm.resetFields()
      setEditingEntry(null)
      if (selectedCollection) loadEntries(selectedCollection.id)
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handleDeleteEntry = async (id: string): Promise<void> => {
    try {
      await knowledgeApi.deleteEntry(id)
      message.success('删除成功')
      if (selectedEntry?.id === id) setSelectedEntry(null)
      if (selectedCollection) loadEntries(selectedCollection.id)
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSearch = async (): Promise<void> => {
    if (!projectId || !searchKeyword.trim()) return
    setLoading(true)
    try {
      const results = await knowledgeApi.search(projectId, searchKeyword)
      setEntries(results || [])
      setActiveTab('entries')
    } catch (error) {
      message.error('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveExternalConfig = async (): Promise<void> => {
    const values = await externalForm.validateFields()
    try {
      await knowledgeApi.setExternalConfig(values)
      message.success('保存成功')
      setExternalConfigVisible(false)
      loadExternalConfig()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleTestConnection = async (): Promise<void> => {
    try {
      const result = await knowledgeApi.testExternalConnection()
      if (result) message.success('连接成功')
      else message.warning('连接失败')
    } catch (error) {
      message.error('连接测试失败')
    }
  }

  const openCollectionModal = (collection?: KnowledgeCollection): void => {
    if (collection) {
      setEditingCollection(collection)
      collectionForm.setFieldsValue(collection)
    } else {
      setEditingCollection(null)
      collectionForm.resetFields()
    }
    setCollectionModalVisible(true)
  }

  const openEntryModal = (entry?: KnowledgeEntry): void => {
    if (entry) {
      setEditingEntry(entry)
      entryForm.setFieldsValue(entry)
    } else {
      setEditingEntry(null)
      entryForm.resetFields()
    }
    setEntryModalVisible(true)
  }

  const collectionTypeColors: Record<string, string> = {
    'world-building': 'blue',
    'character': 'green',
    'plot': 'purple',
    'technology': 'orange',
    'custom': 'default'
  }

  const collectionColumns = [
    { title: '名称', dataIndex: 'name', key: 'name', render: (t: string, r: KnowledgeCollection) => <><FolderOutlined style={{ marginRight: 8 }} />{t}</> },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <AntTag color={collectionTypeColors[t]}>{t}</AntTag> },
    { title: '描述', dataIndex: 'description', key: 'desc', ellipsis: true },
    { title: '条目数', dataIndex: 'entryCount', key: 'count', width: 80 },
    { title: '操作', key: 'action', render: (_: any, r: KnowledgeCollection) => (
      <Space>
        <Button size="small" type="link" onClick={() => openCollectionModal(r)}>编辑</Button>
        <Popconfirm title="确认删除?" onConfirm={() => handleDeleteCollection(r.id)}>
          <Button size="small" type="link" danger>删除</Button>
        </Popconfirm>
      </Space>
    )}
  ]

  const entryColumns = [
    { title: '标题', dataIndex: 'title', key: 'title', render: (t: string, r: KnowledgeEntry) => <><FileTextOutlined style={{ marginRight: 8 }} />{t}</> },
    { title: '来源', dataIndex: 'sourceType', key: 'source', render: (t: string) => <AntTag color={t === 'ai-generated' ? 'purple' : t === 'imported' ? 'blue' : 'default'}>{t}</AntTag> },
    { title: '标签', dataIndex: 'tags', key: 'tags', render: (tags: string[]) => tags?.slice(0, 3).map(tag => <AntTag key={tag}>{tag}</AntTag>) },
    { title: '操作', key: 'action', render: (_: any, r: KnowledgeEntry) => (
      <Space>
        <Button size="small" type="link" onClick={() => setSelectedEntry(r)}>查看</Button>
        <Button size="small" type="link" onClick={() => openEntryModal(r)}>编辑</Button>
        <Popconfirm title="确认删除?" onConfirm={() => handleDeleteEntry(r.id)}>
          <Button size="small" type="link" danger>删除</Button>
        </Popconfirm>
      </Space>
    )}
  ]

  const tabItems = [
    { key: 'collections', label: <span><FolderOutlined /> 知识集合</span>, children: (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCollectionModal()}>新建集合</Button>
          <Button icon={<SettingOutlined />} onClick={() => setExternalConfigVisible(true)}>外部知识库</Button>
        </div>
        <Table dataSource={collections} columns={collectionColumns} rowKey="id" pagination={{ pageSize: 10 }} />
      </div>
    )},
    { key: 'entries', label: <span><FileTextOutlined /> 知识条目</span>, children: (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Input.Search
            placeholder="搜索知识..."
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 300 }}
            enterButton={<SearchOutlined />}
          />
          <Button icon={<ReloadOutlined />} onClick={() => selectedCollection && loadEntries(selectedCollection.id)}>刷新</Button>
        </div>
        {selectedCollection ? (
          <Table dataSource={entries} columns={entryColumns} rowKey="id" pagination={{ pageSize: 10 }} />
        ) : (
          <Empty description="请先选择一个知识集合" />
        )}
      </div>
    )}
  ]

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}><BookOutlined /> 知识库</h2>
        <Space>
          <Button icon={<RollbackOutlined />} onClick={() => navigate(-1)}>返回</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ flex: 1 }}>
        <Col span={6}>
          <Card title="知识集合" extra={<Button size="small" type="link" icon={<PlusOutlined />} onClick={() => openCollectionModal()}>新建</Button>} style={{ height: '100%' }}>
            <List
              dataSource={collections}
              renderItem={item => (
                <List.Item
                  style={{ cursor: 'pointer', padding: '8px 12px', background: selectedCollection?.id === item.id ? '#e6f7ff' : undefined }}
                  onClick={() => setSelectedCollection(item)}
                >
                  <List.Item.Meta
                    avatar={<FolderOutlined style={{ fontSize: 20, color: collectionTypeColors[item.type] }} />}
                    title={item.name}
                    description={`${item.entryCount} 条`}
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无知识集合' }}
            />
          </Card>
        </Col>
        <Col span={18}>
          <Card title={selectedCollection ? `${selectedCollection.name} - 知识条目` : '知识条目'} style={{ height: '100%' }} extra={
            selectedCollection ? <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => openEntryModal()}>新建条目</Button> : undefined
          }>
            {selectedCollection ? (
              <Table dataSource={entries} columns={entryColumns} rowKey="id" pagination={{ pageSize: 10 }} />
            ) : (
              <Empty description="请从左侧选择一个知识集合" />
            )}
          </Card>
        </Col>
      </Row>

      <Drawer title="知识条目详情" placement="right" width={500} open={!!selectedEntry} onClose={() => setSelectedEntry(null)}>
        {selectedEntry && (
          <div>
            <Divider orientation="left">基本信息</Divider>
            <p><Text strong>标题：</Text>{selectedEntry.title}</p>
            <p><Text strong>来源：</Text><AntTag color={selectedEntry.sourceType === 'ai-generated' ? 'purple' : 'blue'}>{selectedEntry.sourceType}</AntTag></p>
            <p><Text strong>标签：</Text>{selectedEntry.tags?.map(tag => <AntTag key={tag}>{tag}</AntTag>)}</p>
            <p><Text strong>创建时间：</Text>{new Date(selectedEntry.createdAt).toLocaleString()}</p>
            <p><Text strong>更新时间：</Text>{new Date(selectedEntry.updatedAt).toLocaleString()}</p>
            <Divider>内容</Divider>
            <Paragraph>{selectedEntry.content}</Paragraph>
            {selectedEntry.summary && (
              <>
                <Divider>摘要</Divider>
                <Paragraph type="secondary">{selectedEntry.summary}</Paragraph>
              </>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title={editingCollection ? '编辑知识集合' : '新建知识集合'}
        open={collectionModalVisible}
        onCancel={() => { setCollectionModalVisible(false); collectionForm.resetFields() }}
        onOk={editingCollection ? handleUpdateCollection : handleCreateCollection}
      >
        <Form form={collectionForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="知识集合名称" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select placeholder="选择类型">
              <Select.Option value="world-building">世界构建</Select.Option>
              <Select.Option value="character">角色</Select.Option>
              <Select.Option value="plot">情节</Select.Option>
              <Select.Option value="technology">技术/功法</Select.Option>
              <Select.Option value="custom">自定义</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="知识集合描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingEntry ? '编辑知识条目' : '新建知识条目'}
        open={entryModalVisible}
        onCancel={() => { setEntryModalVisible(false); entryForm.resetFields() }}
        onOk={editingEntry ? handleUpdateEntry : handleCreateEntry}
        width={700}
      >
        <Form form={entryForm} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="知识条目标题" />
          </Form.Item>
          <Form.Item name="content" label="内容">
            <TextArea rows={10} placeholder="知识内容" />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签后回车" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="外部知识库配置"
        open={externalConfigVisible}
        onCancel={() => setExternalConfigVisible(false)}
        onOk={handleSaveExternalConfig}
      >
        <Form form={externalForm} layout="vertical">
          <Form.Item name="name" label="名称">
            <Input placeholder="如：Ollama本地知识库" />
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Select placeholder="选择类型">
              <Select.Option value="ollama-anything-llm">Ollama/AnythingLLM</Select.Option>
              <Select.Option value="lm-studio">LM Studio</Select.Option>
              <Select.Option value="custom-api">自定义API</Select.Option>
              <Select.Option value="local-vector">本地向量数据库</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="endpoint" label="API地址" rules={[{ required: true }]}>
            <Input placeholder="http://localhost:11434" />
          </Form.Item>
          <Form.Item name="apiKey" label="API密钥">
            <Input.Password placeholder="可选" />
          </Form.Item>
          <Form.Item name="model" label="模型名称">
            <Input placeholder="如：nomic-embed-text" />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <input type="checkbox" />
          </Form.Item>
          <Button icon={<LinkOutlined />} onClick={handleTestConnection}>测试连接</Button>
        </Form>
      </Modal>
    </div>
  )
}

export default KnowledgeBase
