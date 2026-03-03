import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Select, Button, message, Space, List, Popconfirm, Tag } from 'antd'
import { SaveOutlined, FolderOutlined, RollbackOutlined, UndoOutlined, CloudUploadOutlined, FileZipOutlined, DeleteOutlined, RestOutlined } from '@ant-design/icons'
import { useSettingsStore } from '../../stores/settingsStore'
import { dialogApi, settingsApi } from '../../api'

interface BackupInfo {
  name: string
  path: string
  createdAt: string
  size: string
}

function Settings(): JSX.Element {
  const navigate = useNavigate()
  const {
    language, theme, autoSaveInterval, fontSize, font,
    customDataPath, ollamaAddress, aiModel,
    setLanguage, setTheme, setAutoSaveInterval, setFontSize,
    setFont, setCustomDataPath, setOllamaAddress, setAiModel
  } = useSettingsStore()

  const [form] = Form.useForm()
  const [dataPath, setDataPath] = useState(customDataPath)
  const [hasChanges, setHasChanges] = useState(false)
  const [initialValues, setInitialValues] = useState<any>({})
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null)

  useEffect(() => {
    const values = {
      language,
      theme,
      autoSaveInterval,
      fontSize,
      font,
      ollamaAddress,
      aiModel
    }
    form.setFieldsValue(values)
    setDataPath(customDataPath)
    setInitialValues({ ...values, customDataPath })
    loadBackups()
  }, [])

  const loadBackups = async (): Promise<void> => {
    setLoadingBackups(true)
    try {
      const backupList = await window.api.invoke<BackupInfo[]>('backup:list')
      setBackups(backupList || [])
    } catch (error) {
      console.error('加载备份列表失败', error)
    } finally {
      setLoadingBackups(false)
    }
  }

  const handleValuesChange = (): void => {
    setHasChanges(true)
  }

  const handleSelectFolder = async (): Promise<void> => {
    try {
      const path = await dialogApi.selectFolder()
      if (path) {
        setDataPath(path)
        setHasChanges(true)
      }
    } catch (error) {
      message.error('选择文件夹失败')
    }
  }

  const handleSave = async (): Promise<void> => {
    try {
      const values = form.getFieldsValue()
      setLanguage(values.language)
      setTheme(values.theme)
      setAutoSaveInterval(values.autoSaveInterval)
      setFontSize(values.fontSize)
      setFont(values.font)
      setOllamaAddress(values.ollamaAddress)
      setAiModel(values.aiModel)
      setCustomDataPath(dataPath)

      await settingsApi.set('language', values.language)
      await settingsApi.set('theme', values.theme)
      await settingsApi.set('autoSaveInterval', values.autoSaveInterval)
      await settingsApi.set('fontSize', values.fontSize)
      await settingsApi.set('font', values.font)
      await settingsApi.set('ollamaAddress', values.ollamaAddress)
      await settingsApi.set('aiModel', values.aiModel)
      
      if (dataPath) {
        await settingsApi.setCustomDataPath(dataPath)
      }

      setInitialValues({ ...values, customDataPath: dataPath })
      setHasChanges(false)
      message.success('设置已保存')
    } catch (error) {
      message.error('保存设置失败')
    }
  }

  const handleReset = (): void => {
    form.setFieldsValue({
      language: 'zh-CN',
      theme: 'light',
      autoSaveInterval: 30,
      fontSize: 16,
      font: 'monospace',
      ollamaAddress: 'http://localhost:11434',
      aiModel: 'llama2'
    })
    setDataPath('')
    setHasChanges(true)
    message.info('已重置为默认值')
  }

  const handleCancel = (): void => {
    form.setFieldsValue(initialValues)
    setDataPath(initialValues.customDataPath || '')
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

  const handleCreateBackup = async (): Promise<void> => {
    setCreatingBackup(true)
    try {
      await window.api.invoke('backup:create')
      message.success('备份创建成功')
      loadBackups()
    } catch (error) {
      message.error('备份创建失败')
    } finally {
      setCreatingBackup(false)
    }
  }

  const handleRestoreBackup = async (backupName: string): Promise<void> => {
    setRestoringBackup(backupName)
    try {
      await window.api.invoke('backup:restore', backupName)
      message.success('恢复成功，请重启应用')
    } catch (error) {
      message.error('恢复失败')
    } finally {
      setRestoringBackup(null)
    }
  }

  const handleDeleteBackup = async (backupName: string): Promise<void> => {
    try {
      await window.api.invoke('backup:delete', backupName)
      message.success('备份已删除')
      loadBackups()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const languageOptions = [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'en-US', label: 'English' }
  ]

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto', overflow: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>系统设置</h2>
        <Button icon={<RollbackOutlined />} onClick={handleBack}>
          返回
        </Button>
      </div>

      <Card title="基本设置" style={{ marginBottom: 16 }}>
        <Form 
          form={form} 
          layout="vertical"
          onValuesChange={handleValuesChange}
        >
          <Form.Item name="language" label="语言">
            <Select options={languageOptions} />
          </Form.Item>
          <Form.Item label="数据存储路径">
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                value={dataPath || '默认: 用户文档目录/FNW'}
                disabled
                style={{ flex: 1 }}
              />
              <Button icon={<FolderOutlined />} onClick={handleSelectFolder}>
                选择
              </Button>
            </div>
          </Form.Item>
          <Form.Item name="autoSaveInterval" label="自动保存间隔">
            <Select>
              <Select.Option value={10}>10秒</Select.Option>
              <Select.Option value={30}>30秒</Select.Option>
              <Select.Option value={60}>1分钟</Select.Option>
              <Select.Option value={300}>5分钟</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>

      <Card title="编辑器设置" style={{ marginBottom: 16 }}>
        <Form 
          form={form} 
          layout="vertical"
          onValuesChange={handleValuesChange}
        >
          <Form.Item name="fontSize" label="字体大小">
            <Select>
              <Select.Option value={14}>14px</Select.Option>
              <Select.Option value={16}>16px</Select.Option>
              <Select.Option value={18}>18px</Select.Option>
              <Select.Option value={20}>20px</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="font" label="字体">
            <Select>
              <Select.Option value="monospace">等宽字体</Select.Option>
              <Select.Option value="sans">无衬线体</Select.Option>
              <Select.Option value="serif">衬线体</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="theme" label="主题">
            <Select>
              <Select.Option value="light">浅色</Select.Option>
              <Select.Option value="dark">深色</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>

      <Card title="AI设置（可选）" style={{ marginBottom: 16 }}>
        <Form 
          form={form} 
          layout="vertical"
          onValuesChange={handleValuesChange}
        >
          <Form.Item name="ollamaAddress" label="Ollama地址">
            <Input placeholder="http://localhost:11434" />
          </Form.Item>
          <Form.Item name="aiModel" label="AI模型">
            <Select placeholder="选择本地模型">
              <Select.Option value="llama2">llama2</Select.Option>
              <Select.Option value="qwen">qwen</Select.Option>
              <Select.Option value="glm4">glm4</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>

      <Card 
        title={
          <Space>
            <FileZipOutlined />
            备份与恢复
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<CloudUploadOutlined />} 
            onClick={handleCreateBackup}
            loading={creatingBackup}
          >
            一键备份
          </Button>
        }
      >
        {backups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
            暂无备份，点击"一键备份"创建
          </div>
        ) : (
          <List
            dataSource={backups}
            renderItem={(backup) => (
              <List.Item
                actions={[
                  <Button 
                    key="restore" 
                    type="link" 
                    icon={<RestOutlined />} 
                    onClick={() => handleRestoreBackup(backup.name)}
                    loading={restoringBackup === backup.name}
                  >
                    恢复
                  </Button>,
                  <Popconfirm key="delete" title="确认删除此备份?" onConfirm={() => handleDeleteBackup(backup.name)}>
                    <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  avatar={<FileZipOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                  title={
                    <Space>
                      {backup.name}
                      <Tag color="blue">{backup.size}</Tag>
                    </Space>
                  }
                  description={`创建时间: ${new Date(backup.createdAt).toLocaleString()}`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button icon={<UndoOutlined />} onClick={handleReset}>
            重置
          </Button>
          {hasChanges && (
            <Button onClick={handleCancel}>
              取消更改
            </Button>
          )}
        </Space>
        <Space>
          <Button onClick={handleBack}>
            返回
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSave}
            disabled={!hasChanges}
          >
            保存设置
          </Button>
        </Space>
      </div>
    </div>
  )
}

export default Settings
