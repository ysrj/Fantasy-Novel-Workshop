import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Input, Button, Space, List, Modal, Form, Select, message } from 'antd'
import { PlusOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons'
import { useProjectStore } from '../../stores/projectStore'

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
  const { currentProject } = useProjectStore()
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedChar, setSelectedChar] = useState<Character | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
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
    } catch (error) {
      message.error('加载角色失败')
    }
  }

  const saveCharacters = async (): Promise<void> => {
    if (!projectId) return
    try {
      await window.api.invoke('character:save', projectId, characters)
      message.success('角色已保存')
    } catch (error) {
      message.error('保存角色失败')
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
  }

  const handleSave = (): void => {
    form.validateFields().then((values) => {
      if (selectedChar) {
        setCharacters(characters.map((c) => (c.id === selectedChar.id ? { ...values, id: c.id } : c)))
      } else {
        setCharacters([...characters, { ...values, id: `char_${Date.now()}` }])
      }
      setIsModalVisible(false)
      saveCharacters()
    })
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
              actions={[
                <Button type="link" size="small" onClick={() => handleEdit(char)}>
                  编辑
                </Button>,
                <Button type="link" danger size="small" onClick={() => handleDelete(char.id)}>
                  删除
                </Button>
              ]}
            >
              <List.Item.Meta title={char.name} description={char.role} />
            </List.Item>
          )}
        />
      </div>

      <div style={{ flex: 1, background: '#fff', borderRadius: 8, padding: 24, overflow: 'auto' }}>
        {selectedChar ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2>{selectedChar.name}</h2>
              <Button icon={<SaveOutlined />} onClick={saveCharacters}>
                保存
              </Button>
            </div>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <label>姓名: </label>
                <Input
                  value={selectedChar.name}
                  onChange={(e) => {
                    const updated = { ...selectedChar, name: e.target.value }
                    setSelectedChar(updated)
                    setCharacters(characters.map((c) => (c.id === selectedChar.id ? updated : c)))
                  }}
                />
              </div>
              <div>
                <label>角色定位: </label>
                <Input
                  value={selectedChar.role}
                  onChange={(e) => {
                    const updated = { ...selectedChar, role: e.target.value }
                    setSelectedChar(updated)
                    setCharacters(characters.map((c) => (c.id === selectedChar.id ? updated : c)))
                  }}
                />
              </div>
              <div>
                <label>外貌描述: </label>
                <Input.TextArea
                  rows={3}
                  value={selectedChar.appearance}
                  onChange={(e) => {
                    const updated = { ...selectedChar, appearance: e.target.value }
                    setSelectedChar(updated)
                    setCharacters(characters.map((c) => (c.id === selectedChar.id ? updated : c)))
                  }}
                />
              </div>
              <div>
                <label>性格特点: </label>
                <Input.TextArea
                  rows={3}
                  value={selectedChar.personality}
                  onChange={(e) => {
                    const updated = { ...selectedChar, personality: e.target.value }
                    setSelectedChar(updated)
                    setCharacters(characters.map((c) => (c.id === selectedChar.id ? updated : c)))
                  }}
                />
              </div>
            </Space>
          </>
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
        onOk={handleSave}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色定位">
            <Input placeholder="主角/配角/反派等" />
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
