import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Input, Button, Space, List, Modal, Form, Select, message, Tabs } from 'antd'
import { PlusOutlined, SaveOutlined, RollbackOutlined, UndoOutlined, ApiOutlined } from '@ant-design/icons'
import { useProjectStore } from '../../stores/projectStore'
import { useSettingsStore } from '../../stores/settingsStore'
import NovelRelationshipGraph from '../../components/RelationshipGraph/NovelRelationshipGraph'
import { characterApi } from '../../api'

interface Character {
  id: string
  name: string
  nickname?: string
  gender?: string
  age?: string
  appearance: string
  personality: string
  background: string
  abilities: string
  role: string
  status: string
}

interface Relationship {
  source: string
  target: string
  type: string
  description: string
}

function CharacterEditor(): JSX.Element {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { } = useProjectStore()
  const { } = useSettingsStore()
  const [characters, setCharacters] = useState<Character[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [selectedChar, setSelectedChar] = useState<Character | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isRelModalVisible, setIsRelModalVisible] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [initialCharacters, setInitialCharacters] = useState<Character[]>([])
  const [activeTab, setActiveTab] = useState('list')
  const [form] = Form.useForm()
  const [relForm] = Form.useForm()

  useEffect(() => {
    if (projectId) {
      loadCharacters()
      loadRelationships()
    }
  }, [projectId])

  const loadCharacters = async (): Promise<void> => {
    if (!projectId) return
    try {
      const data = await characterApi.list(projectId) as unknown as Character[]
      setCharacters(data)
      setInitialCharacters(JSON.parse(JSON.stringify(data)))
    } catch (error) {
      message.error('加载角色失败')
    }
  }

  const loadRelationships = async (): Promise<void> => {
    if (!projectId) return
    try {
      const data = await characterApi.getRelationships(projectId) as unknown as Relationship[]
      setRelationships(data || [])
    } catch (error) {
      console.error('加载关系失败', error)
    }
  }

  const handleChange = (): void => {
    setHasChanges(true)
  }

  const saveCharacters = async (): Promise<void> => {
    if (!projectId) return
    try {
      await characterApi.save(projectId, characters)
      await characterApi.saveRelationships(projectId, relationships)
      setInitialCharacters(JSON.parse(JSON.stringify(characters)))
      setHasChanges(false)
      message.success('角色已保存')
    } catch (error) {
      message.error('保存角色失败')
    }
  }

  const handleReset = (): void => {
    setCharacters(JSON.parse(JSON.stringify(initialCharacters)))
    setSelectedChar(null)
    setHasChanges(false)
    message.info('已重置')
  }

  const handleCancel = (): void => {
    setCharacters(JSON.parse(JSON.stringify(initialCharacters)))
    setSelectedChar(null)
    setHasChanges(false)
    message.info('已取消更改')
  }

  const handleBack = (): void => {
    if (hasChanges) {
      message.warning('您有未保存的更改')
    } else {
      navigate(-1)
    }
  }

  const handleAdd = (): void => {
    form.resetFields()
    setSelectedChar(null)
    setIsModalVisible(true)
  }

  const handleEdit = (char: Character): void => {
    setSelectedChar(char)
    form.setFieldsValue(char)
    setIsModalVisible(true)
  }

  const handleDelete = (id: string): void => {
    setCharacters(characters.filter((c) => c.id !== id))
    setRelationships(relationships.filter(r => r.source !== id && r.target !== id))
    if (selectedChar?.id === id) {
      setSelectedChar(null)
    }
    handleChange()
  }

  const handleSaveModal = (): void => {
    form.validateFields().then((values) => {
      if (selectedChar) {
        setCharacters(characters.map((c) => (c.id === selectedChar.id ? { ...values, id: c.id } : c)))
      } else {
        setCharacters([...characters, { ...values, id: `char_${Date.now()}` }])
      }
      setIsModalVisible(false)
      handleChange()
    })
  }

  const handleCharSelect = (char: Character): void => {
    if (hasChanges) {
      message.warning('请先保存当前更改')
      return
    }
    setSelectedChar(char)
  }

  const updateSelectedChar = (field: string, value: string): void => {
    if (!selectedChar) return
    const updated = { ...selectedChar, [field]: value }
    setSelectedChar(updated)
    setCharacters(characters.map((c) => (c.id === selectedChar.id ? updated : c)))
    handleChange()
  }

  const addRelationship = (): void => {
    relForm.resetFields()
    setIsRelModalVisible(true)
  }

  const handleSaveRelationship = (): void => {
    relForm.validateFields().then((values) => {
      setRelationships([...relationships, values])
      setIsRelModalVisible(false)
      handleChange()
    })
  }

  const deleteRelationship = (index: number): void => {
    setRelationships(relationships.filter((_, i) => i !== index))
    handleChange()
  }

  const tabItems = [
    {
      key: 'list',
      label: '角色列表',
      children: (
        <div style={{ display: 'flex', gap: 16, height: '100%' }}>
          <div style={{ width: 280, background: '#fff', borderRadius: 8, padding: 16, overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>角色列表</h3>
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAdd}>
                添加
              </Button>
            </div>
            <List
              dataSource={characters}
              renderItem={(char) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    background: selectedChar?.id === char.id ? '#e6f7ff' : 'transparent'
                  }}
                  onClick={() => handleCharSelect(char)}
                  actions={[
                    <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); handleEdit(char) }}>
                      编辑
                    </Button>,
                    <Button type="link" danger size="small" onClick={(e) => { e.stopPropagation(); handleDelete(char.id) }}>
                      删除
                    </Button>
                  ]}
                >
                  <List.Item.Meta title={char.name} description={char.role} />
                </List.Item>
              )}
            />
          </div>

          <div style={{ flex: 1, background: '#fff', borderRadius: 8, padding: 24, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {selectedChar ? (
              <div style={{ flex: 1 }}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <div>
                    <label style={{ display: 'block', marginBottom: 4 }}>姓名: </label>
                    <Input value={selectedChar.name} onChange={(e) => updateSelectedChar('name', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4 }}>角色定位: </label>
                    <Input value={selectedChar.role} onChange={(e) => updateSelectedChar('role', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4 }}>性别: </label>
                    <Select value={selectedChar.gender} onChange={(value) => updateSelectedChar('gender', value)} style={{ width: '100%' }}>
                      <Select.Option value="男">男</Select.Option>
                      <Select.Option value="女">女</Select.Option>
                      <Select.Option value="其他">其他</Select.Option>
                    </Select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4 }}>外貌描述: </label>
                    <Input.TextArea rows={3} value={selectedChar.appearance} onChange={(e) => updateSelectedChar('appearance', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4 }}>性格特点: </label>
                    <Input.TextArea rows={3} value={selectedChar.personality} onChange={(e) => updateSelectedChar('personality', e.target.value)} />
                  </div>
                </Space>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', marginTop: 48 }}>
                选择或添加角色进行编辑
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'graph',
      label: <span><ApiOutlined /> 关系图谱</span>,
      children: (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button icon={<PlusOutlined />} onClick={addRelationship}>添加关系</Button>
              <span style={{ color: '#999', fontSize: 12 }}>点击节点可查看角色详情</span>
            </Space>
          </div>
          <NovelRelationshipGraph
            characters={characters.map(c => ({
              id: c.id,
              name: c.name,
              role: c.role,
              realm: c.abilities,
              faction: undefined
            }))}
            relationships={relationships.map(r => ({
              source: r.source,
              target: r.target,
              type: r.type,
              description: r.description
            }))}
            onNodeClick={(char) => {
              const fullChar = characters.find(c => c.id === char.id)
              if (fullChar) {
                setSelectedChar(fullChar)
                setActiveTab('list')
              }
            }}
            layout="force"
          />
        </div>
      )
    }
  ]

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>角色管理</h2>
        <Space>
          <Button icon={<RollbackOutlined />} onClick={handleBack}>返回</Button>
          {hasChanges && <Button onClick={handleCancel}>取消</Button>}
          <Button icon={<UndoOutlined />} onClick={handleReset}>重置</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={saveCharacters} disabled={!hasChanges}>保存</Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ flex: 1 }} />

      <Modal title="编辑角色" open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={handleSaveModal}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色定位">
            <Input placeholder="主角/配角/反派" />
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select options={[{ value: '男' }, { value: '女' }, { value: '其他' }]} />
          </Form.Item>
          <Form.Item name="appearance" label="外貌描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="personality" label="性格特点">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="添加关系" open={isRelModalVisible} onCancel={() => setIsRelModalVisible(false)} onOk={handleSaveRelationship}>
        <Form form={relForm} layout="vertical">
          <Form.Item name="source" label="角色1" rules={[{ required: true }]}>
            <Select options={characters.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="type" label="关系类型" rules={[{ required: true }]}>
            <Select options={[
              { value: '父子', label: '父子' },
              { value: '母女', label: '母女' },
              { value: '兄弟', label: '兄弟' },
              { value: '姐妹', label: '姐妹' },
              { value: '夫妻', label: '夫妻' },
              { value: '恋人', label: '恋人' },
              { value: '师徒', label: '师徒' },
              { value: '朋友', label: '朋友' },
              { value: '敌人', label: '敌人' },
              { value: '同盟', label: '同盟' }
            ]} />
          </Form.Item>
          <Form.Item name="target" label="角色2" rules={[{ required: true }]}>
            <Select options={characters.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CharacterEditor
