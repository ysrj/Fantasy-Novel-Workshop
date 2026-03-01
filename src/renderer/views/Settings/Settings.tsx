import { useState, useEffect } from 'react'
import { Card, Form, Input, Select, Button, message } from 'antd'
import { SaveOutlined, FolderOutlined } from '@ant-design/icons'
import { useSettingsStore } from '../../stores/settingsStore'

function Settings(): JSX.Element {
  const {
    language, theme, autoSaveInterval, fontSize, font,
    customDataPath, ollamaAddress, aiModel,
    setLanguage, setTheme, setAutoSaveInterval, setFontSize,
    setFont, setCustomDataPath, setOllamaAddress, setAiModel
  } = useSettingsStore()

  const [form] = Form.useForm()
  const [dataPath, setDataPath] = useState(customDataPath)

  useEffect(() => {
    form.setFieldsValue({
      language,
      theme,
      autoSaveInterval,
      fontSize,
      font,
      ollamaAddress,
      aiModel
    })
    setDataPath(customDataPath)
  }, [])

  const handleSelectFolder = async (): Promise<void> => {
    try {
      const path = await window.api.invoke<string | null>('dialog:selectFolder')
      if (path) {
        setDataPath(path)
        setCustomDataPath(path)
        await window.api.invoke('settings:setCustomDataPath', path)
        message.success('存储路径已设置')
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

      await window.api.invoke('settings:set', 'language', values.language)
      await window.api.invoke('settings:set', 'theme', values.theme)
      await window.api.invoke('settings:set', 'autoSaveInterval', values.autoSaveInterval)
      await window.api.invoke('settings:set', 'fontSize', values.fontSize)
      await window.api.invoke('settings:set', 'font', values.font)
      await window.api.invoke('settings:set', 'ollamaAddress', values.ollamaAddress)
      await window.api.invoke('settings:set', 'aiModel', values.aiModel)

      message.success('设置已保存')
    } catch (error) {
      message.error('保存设置失败')
    }
  }

  const languageOptions = [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'en-US', label: 'English' }
  ]

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24 }}>系统设置</h2>

      <Card title="基本设置" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
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
        <Form form={form} layout="vertical">
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
        <Form form={form} layout="vertical">
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

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
          保存设置
        </Button>
      </div>
    </div>
  )
}

export default Settings
