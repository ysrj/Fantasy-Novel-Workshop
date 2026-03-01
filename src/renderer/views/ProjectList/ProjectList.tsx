import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Modal, Form, message } from 'antd'
import { PlusOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons'
import { useProjectStore, Project } from '../../stores/projectStore'

declare global {
  interface Window {
    api: {
      invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>
    }
  }
}

function ProjectList(): JSX.Element {
  const navigate = useNavigate()
  const { projects, setProjects, addProject, removeProject, loading, setLoading } =
    useProjectStore()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async (): Promise<void> => {
    setLoading(true)
    try {
      const projectList = await window.api.invoke<Project[]>('project:list')
      setProjects(projectList)
    } catch (error) {
      message.error('加载项目失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values: { title: string; description: string; targetWordCount: number }): Promise<void> => {
    try {
      const newProject = await window.api.invoke<Project>('project:create', {
        title: values.title,
        description: values.description,
        targetWordCount: values.targetWordCount || 100000,
        tags: []
      })
      addProject(newProject)
      setIsModalVisible(false)
      form.resetFields()
      message.success('项目创建成功')
    } catch (error) {
      message.error('创建项目失败')
    }
  }

  const handleDelete = async (projectId: string, e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个项目吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await window.api.invoke('project:delete', projectId)
          removeProject(projectId)
          message.success('项目已删除')
        } catch (error) {
          message.error('删除项目失败')
        }
      }
    })
  }

  const handleOpenProject = (project: Project): void => {
    useProjectStore.getState().setCurrentProject(project)
    navigate(`/workspace/${project.id}`)
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>
          <BookOutlined style={{ marginRight: 8 }} />
          我的作品
        </h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          新建项目
        </Button>
      </div>

      {projects.length === 0 && !loading ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <BookOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
          <p style={{ color: '#999' }}>暂无作品，点击"新建项目"开始创作</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {projects.map((project) => (
            <Card
              key={project.id}
              hoverable
              onClick={() => handleOpenProject(project)}
              actions={[
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => handleDelete(project.id, e)}
                >
                  删除
                </Button>
              ]}
            >
              <Card.Meta
                title={project.title}
                description={
                  <div>
                    <p>{project.description || '暂无简介'}</p>
                    <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                      目标字数: {project.targetWordCount.toLocaleString()} |
                      创建于: {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                }
              />
            </Card>
          ))}
        </div>
      )}

      <Modal
        title="新建项目"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="title"
            label="作品标题"
            rules={[{ required: true, message: '请输入作品标题' }]}
          >
            <Input placeholder="输入作品标题" />
          </Form.Item>
          <Form.Item name="description" label="作品简介">
            <Input.TextArea rows={3} placeholder="输入作品简介（可选）" />
          </Form.Item>
          <Form.Item
            name="targetWordCount"
            label="目标字数"
            initialValue={100000}
          >
            <Input type="number" placeholder="目标字数" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProjectList
