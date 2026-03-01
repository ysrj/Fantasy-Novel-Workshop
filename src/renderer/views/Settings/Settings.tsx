import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Select, Button, message, Space } from 'antd'
import { SaveOutlined, FolderOutlined, RollbackOutlined, UndoOutlined } from '@ant-design/icons'
import { useSettingsStore } from '../../stores/settingsStore'

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
  }, [])

  const handleValuesChange = (): void => {
    setHasChanges(true)
  }

  const handleSelectFolder = async (): Promise<void> => {
    try {
      const path = await window.api.invoke<string | null>('dialog:selectFolder')
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

      await window.api.invoke('settings:set', 'language', values.language)
      await window.api.invoke('settings:set', 'theme', values.theme)
      await window.api.invoke('settings:set', 'autoSaveInterval', values.autoSaveInterval)
      await window.api.invoke('settings:set', 'fontSize', values.fontSize)
      await window.api.invoke('settings:set', 'font', values.font)
      await window.api.invoke('settings:set', 'ollamaAddress', values.ollamaAddress)
      await window.api.invoke('settings:set', 'aiModel', values.aiModel)
      
      if (dataPath) {
        await window.api.invoke('settings:setCustomDataPath', dataPath)
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

  const languageOptions = [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'en-US', label: 'English' }
  ]

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
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

      <Card title="AI设置（可选）">
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
