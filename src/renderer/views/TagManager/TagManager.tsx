import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Tree, Button, Modal, Form, Input, Select, ColorPicker, Space, message, Tag, Card, Empty } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, TagsOutlined } from '@ant-design/icons'
import { useTagStore } from '../../stores/tagStore'
import { tagApi } from '../../api'
import type { Tag as TagType } from '../../../shared/types'

type Tag = TagType

function TagManager(): JSX.Element {
  const { projectId } = useParams()
  const { tags, setTags } = useTagStore()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    if (projectId) {
      loadTags()
    }
  }, [projectId])

  const loadTags = async (): Promise<void> => {
    if (!projectId) return
    try {
      const data = await tagApi.list(projectId)
      setTags(data)
    } catch (error) {
      message.error('加载标签失败')
    }
  }

  const buildTreeData = (): any[] => {
    const rootTags = tags.filter((t) => !t.parentId)
    const buildNode = (tag: Tag): any => ({
      key: tag.id,
      title: (
        <span>
          <Tag color={tag.color}>{tag.name}</Tag>
          <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>{tag.type}</span>
        </span>
      ),
      children: tags.filter((t) => t.parentId === tag.id).map(buildNode)
    })
    return rootTags.map(buildNode)
  }

  const handleAdd = (): void => {
    form.resetFields()
    setEditingTag(null)
    setIsModalVisible(true)
  }

  const handleEdit = (tag: Tag): void => {
    setEditingTag(tag)
    form.setFieldsValue({
      name: tag.name,
      parentId: tag.parentId,
      color: tag.color,
      description: tag.description,
      type: tag.type
    })
    setIsModalVisible(true)
  }

  const handleSave = async (): Promise<void> => {
    if (!projectId) return
    const values = await form.validateFields()
    try {
      if (editingTag) {
        await tagApi.update(editingTag.id, values.name, values.parentId, values.color, values.description)
        message.success('标签已更新')
      } else {
        await tagApi.add(projectId, values.name, values.parentId, values.color, values.description, values.type)
        message.success('标签已添加')
      }
      setIsModalVisible(false)
      loadTags()
    } catch (error) {
      message.error('保存标签失败')
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个标签吗？',
      onOk: async () => {
        try {
          await tagApi.delete(id)
          message.success('标签已删除')
          loadTags()
        } catch (error) {
          message.error('删除标签失败')
        }
      }
    })
  }

  const tagOptions = tags.map((t) => ({ value: t.id, label: t.name }))

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>
          <TagsOutlined style={{ marginRight: 8 }} />
          标签管理
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加标签
        </Button>
      </div>

      {tags.length === 0 ? (
        <Empty description="暂无标签，点击添加开始创建" />
      ) : (
        <Card style={{ flex: 1 }}>
          <Tree
            showLine
            treeData={buildTreeData()}
            defaultExpandAll
            onSelect={(keys) => {
              if (keys.length > 0) {
                const tag = tags.find((t) => t.id === keys[0])
                if (tag) handleEdit(tag)
              }
            }}
          />
        </Card>
      )}

      <Modal
        title={editingTag ? '编辑标签' : '添加标签'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSave}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="标签名称" rules={[{ required: true, message: '请输入标签名称' }]}>
            <Input placeholder="如：主角, 修炼体系" />
          </Form.Item>
          <Form.Item name="parentId" label="父级标签">
            <Select placeholder="选择父级标签（可选）" allowClear options={tagOptions} />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select
              options={[
                { value: 'character', label: '角色' },
                { value: 'world', label: '世界' },
                { value: 'inspiration', label: '灵感' },
                { value: 'chapter', label: '章节' },
                { value: 'custom', label: '自定义' }
              ]}
            />
          </Form.Item>
          <Form.Item name="color" label="颜色">
            <ColorPicker format="hex" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="标签描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TagManager
