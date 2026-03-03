import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Modal, Form, message } from 'antd'
import { PlusOutlined, DeleteOutlined, BookOutlined, FolderOutlined } from '@ant-design/icons'
import { useProjectStore, Project } from '../../stores/projectStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { projectApi, dialogApi, settingsApi } from '../../api'

function ProjectList(): JSX.Element {
  const navigate = useNavigate()
  const { projects, setProjects, addProject, removeProject, loading, setLoading } =
    useProjectStore()
  const translations = useSettingsStore((state) => state.getTranslations())
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [customPath, setCustomPath] = useState('')
  const [form] = Form.useForm()

  useEffect(() => {
    loadProjects()
  }, [])

  const t = translations

  const loadProjects = async (): Promise<void> => {
    setLoading(true)
    try {
      const projectList = await projectApi.list()
      setProjects(projectList)
    } catch (error) {
      message.error(t.error || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPath = async (): Promise<void> => {
    try {
      const path = await dialogApi.selectFolder()
      if (path) {
        setCustomPath(path)
      }
    } catch (error) {
      message.error('Error selecting folder')
    }
  }

  const handleCreate = async (values: { title: string; description: string; targetWordCount: number }): Promise<void> => {
    try {
      if (customPath) {
        await settingsApi.setCustomDataPath(customPath)
      }
      
      const newProject = await projectApi.create({
        title: values.title,
        description: values.description,
        targetWordCount: values.targetWordCount || 100000,
        tags: []
      })
      addProject(newProject)
      setIsModalVisible(false)
      form.resetFields()
      setCustomPath('')
      message.success(t.success || 'Success')
    } catch (error) {
      message.error(t.error || 'Error')
    }
  }

  const handleDelete = async (projectId: string, e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    Modal.confirm({
      title: t.confirmDelete || 'Confirm',
      content: t.deleteWarning || 'Are you sure?',
      okText: t.confirm || 'OK',
      cancelText: t.cancel || 'Cancel',
      onOk: async () => {
        try {
          await projectApi.delete(projectId)
          removeProject(projectId)
          message.success(t.success || 'Success')
        } catch (error) {
          message.error(t.error || 'Error')
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
          {t.myProjects || 'My Projects'}
        </h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          {t.newProject || 'New Project'}
        </Button>
      </div>

      {projects.length === 0 && !loading ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <BookOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
          <p style={{ color: '#999' }}>{t.noProjects || 'No projects yet'}</p>
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
                  {t.delete || 'Delete'}
                </Button>
              ]}
            >
              <Card.Meta
                title={project.title}
                description={
                  <div>
                    <p>{project.description || ''}</p>
                    <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                      {t.targetWordCount || 'Target'}: {project.targetWordCount.toLocaleString()} |
                      {t.createdAt || 'Created'}: {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                }
              />
            </Card>
          ))}
        </div>
      )}

      <Modal
        title={t.newProject || 'New Project'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          setCustomPath('')
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="title"
            label={t.projectTitle || 'Title'}
            rules={[{ required: true, message: t.projectTitle || 'Required' }]}
          >
            <Input placeholder={t.projectTitle || 'Enter title'} />
          </Form.Item>
          <Form.Item name="description" label={t.projectDescription || 'Description'}>
            <Input.TextArea rows={3} placeholder={t.projectDescription || 'Enter description'} />
          </Form.Item>
          <Form.Item
            name="targetWordCount"
            label={t.targetWordCount || 'Target Words'}
            initialValue={100000}
          >
            <Input type="number" placeholder="100000" />
          </Form.Item>
          <Form.Item label={t.dataPath || 'Data Path'}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder={t.selectFolder || 'Select folder'}
                style={{ flex: 1 }}
              />
              <Button icon={<FolderOutlined />} onClick={handleSelectPath}>
                {t.selectFolder || 'Browse'}
              </Button>
            </div>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {t.createProject || 'Create'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProjectList
