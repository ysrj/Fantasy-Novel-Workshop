import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Input, Button, Space, List, Modal, Form, Select, message } from 'antd'
import { PlusOutlined, SaveOutlined, DeleteOutlined, RollbackOutlined, UndoOutlined } from '@ant-design/icons'
import { useProjectStore } from '../../stores/projectStore'
import { useSettingsStore } from '../../stores/settingsStore'

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

function CharacterEditor(): JSX.Element {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { currentProject } = useProjectStore()
  const t = useSettingsStore(state => state.getTranslations())
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedChar, setSelectedChar] = useState<Character | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [initialCharacters, setInitialCharacters] = useState<Character[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    if (projectId) {
      loadCharacters()
    }
  }, [projectId])

  const loadCharacters = async (): Promise<void> => {
    if (!projectId) return
    try {
      const data = await window.api.invoke<Character[]>('character:list', projectId)
      setCharacters(data)
      setInitialCharacters(JSON.parse(JSON.stringify(data)))
    } catch (error) {
      message.error('加载角色失败')
    }
  }

  const handleChange = (): void => {
    setHasChanges(true)
  }

  const saveCharacters = async (): Promise<void> => {
    if (!projectId) return
    try {
      await window.api.invoke('character:save', projectId, characters)
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

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', gap: 16 }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>{selectedChar ? selectedChar.name : '角色详情'}</h2>
          <Space>
            <Button icon={<RollbackOutlined />} onClick={handleBack}>
              返回
            </Button>
            {hasChanges && (
              <Button onClick={handleCancel}>
                取消
              </Button>
            )}
            <Button icon={<UndoOutlined />} onClick={handleReset}>
              重置
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={saveCharacters}
              disabled={!hasChanges}
            >
              保存
            </Button>
          </Space>
        </div>

        {selectedChar ? (
          <div style={{ flex: 1 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>姓名: </label>
                <Input
                  value={selectedChar.name}
                  onChange={(e) => updateSelectedChar('name', e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>角色定位: </label>
                <Input
                  value={selectedChar.role}
                  onChange={(e) => updateSelectedChar('role', e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>性别: </label>
                <Select
                  value={selectedChar.gender}
                  onChange={(value) => updateSelectedChar('gender', value)}
                  style={{ width: '100%' }}
                >
                  <Select.Option value="男">男</Select.Option>
                  <Select.Option value="女">女</Select.Option>
                  <Select.Option value="其他">其他</Select.Option>
                </Select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>外貌描述: </label>
                <Input.TextArea
                  rows={3}
                  value={selectedChar.appearance}
                  onChange={(e) => updateSelectedChar('appearance', e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>性格特点: </label>
                <Input.TextArea
                  rows={3}
                  value={selectedChar.personality}
                  onChange={(e) => updateSelectedChar('personality', e.target.value)}
                />
              </div>
            </Space>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', marginTop: 48 }}>
            选择或添加角色进行编辑
          </div>
        )}
      </div>

      <Modal
        title={selectedChar ? '编辑角色' : '添加角色'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSaveModal}
      >
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
    </div>
  )
}

export default CharacterEditor
