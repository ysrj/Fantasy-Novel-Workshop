import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Button, Space, Spin, message, Alert, Select, Divider, List, Modal, Form, Input, Popconfirm } from 'antd'
import { RobotOutlined, CheckCircleOutlined, WarningOutlined, InfoCircleOutlined, ThunderboltOutlined, EditOutlined, ExpandOutlined, CompressOutlined, PlusOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons'

interface AICheckResult {
  type: string
  severity: 'info' | 'warning' | 'error'
  message: string
  location?: string
}

interface CustomPrompt {
  id: string
  projectId: string
  name: string
  prompt: string
  created_at: string
}

function AIAssistant(): JSX.Element {
  const { projectId } = useParams()
  const [aiAvailable, setAiAvailable] = useState(false)
  const [checking, setChecking] = useState(true)
  const [checkingConsistency, setCheckingConsistency] = useState(false)
  const [checkResults, setCheckResults] = useState<AICheckResult[]>([])
  const [enhanceLoading, setEnhanceLoading] = useState(false)
  const [enhancedContent, setEnhancedContent] = useState('')
  const [enhanceType, setEnhanceType] = useState<'polish' | 'expand' | 'summary'>('polish')
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([])
  const [isPromptModalVisible, setIsPromptModalVisible] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null)
  const [promptForm] = Form.useForm()
  const [customPromptLoading, setCustomPromptLoading] = useState(false)
  const [customResult, setCustomResult] = useState('')

  useEffect(() => {
    checkAIStatus()
    if (projectId) {
      loadCustomPrompts()
    }
  }, [projectId])

  const checkAIStatus = async (): Promise<void> => {
    setChecking(true)
    try {
      const available = await window.api.invoke<boolean>('ai:checkStatus')
      setAiAvailable(available)
    } catch (error) {
      setAiAvailable(false)
    } finally {
      setChecking(false)
    }
  }

  const loadCustomPrompts = async (): Promise<void> => {
    if (!projectId) return
    try {
      const prompts = await window.api.invoke<CustomPrompt[]>('ai:listPrompts', projectId)
      setCustomPrompts(prompts || [])
    } catch (error) {
      console.error('加载自定义提示失败', error)
    }
  }

  const handleConsistencyCheck = async (): Promise<void> => {
    if (!projectId) return
    setCheckingConsistency(true)
    setCheckResults([])
    try {
      const results = await window.api.invoke<AICheckResult[]>('ai:checkConsistency', projectId)
      setCheckResults(results)
      if (results.length === 0) {
        message.success('一致性检查完成，未发现问题')
      }
    } catch (error) {
      message.error('检查失败')
    } finally {
      setCheckingConsistency(false)
    }
  }

  const handleEnhanceWriting = async (): Promise<void> => {
    setEnhanceLoading(true)
    setEnhancedContent('')
    try {
      const demoContent = '# 示例章节\n\n主角叶凡站在山巅，望着远处的云海，心中豪情万丈...\n\n这是第一章的内容，展示主角的胸怀和志向。'
      const result = await window.api.invoke<string | null>('ai:enhanceWriting', demoContent, enhanceType)
      if (result) {
        setEnhancedContent(result)
        message.success('内容优化完成')
      } else {
        message.warning('AI 不可用，无法生成内容')
      }
    } catch (error) {
      message.error('优化失败')
    } finally {
      setEnhanceLoading(false)
    }
  }

  const handleAddPrompt = (): void => {
    promptForm.resetFields()
    setEditingPrompt(null)
    setIsPromptModalVisible(true)
  }

  const handleEditPrompt = (prompt: CustomPrompt): void => {
    setEditingPrompt(prompt)
    promptForm.setFieldsValue({ name: prompt.name, prompt: prompt.prompt })
    setIsPromptModalVisible(true)
  }

  const handleSavePrompt = async (): Promise<void> => {
    if (!projectId) return
    const values = await promptForm.validateFields()
    try {
      await window.api.invoke('ai:savePrompt', projectId, editingPrompt?.id || null, values.name, values.prompt)
      message.success(editingPrompt ? '提示词已更新' : '提示词已添加')
      setIsPromptModalVisible(false)
      loadCustomPrompts()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleDeletePrompt = async (id: string): Promise<void> => {
    try {
      await window.api.invoke('ai:deletePrompt', id)
      message.success('提示词已删除')
      loadCustomPrompts()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleRunCustomPrompt = async (prompt: CustomPrompt): Promise<void> => {
    setCustomPromptLoading(true)
    setCustomResult('')
    try {
      const result = await window.api.invoke<string>('ai:generate', prompt.prompt, 'llama2')
      if (result) {
        setCustomResult(result)
        message.success('生成完成')
      }
    } catch (error) {
      message.error('生成失败')
    } finally {
      setCustomPromptLoading(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <WarningOutlined style={{ color: '#ff4d4f' }} />
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'red'
      case 'warning':
        return 'orange'
      default:
        return 'blue'
    }
  }

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin tip="检查 AI 状态..." />
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto', overflow: 'auto', height: '100%' }}>
      <h2 style={{ marginBottom: 24 }}>
        <RobotOutlined style={{ marginRight: 8 }} />
        AI 辅助
      </h2>

      {!aiAvailable && (
        <Alert
          type="warning"
          message="Ollama 未运行"
          description="AI 辅助功能需要 Ollama 在后台运行。请安装并启动 Ollama 后刷新页面。"
          style={{ marginBottom: 24 }}
        />
      )}

      {aiAvailable && (
        <Alert
          type="success"
          message="AI 已就绪"
          description=" Ollama 已连接，可以使用的 AI 辅助功能。"
          style={{ marginBottom: 24 }}
        />
      )}

      <Card title="写作一致性检查" style={{ marginBottom: 16 }}>
        <p>检查文章中的人物名、时间线、实力等级等是否一致。</p>
        <Button 
          type="primary" 
          icon={<CheckCircleOutlined />} 
          onClick={handleConsistencyCheck}
          loading={checkingConsistency}
          disabled={!aiAvailable}
        >
          开始检查
        </Button>

        {checkResults.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Divider>检查结果</Divider>
            {checkResults.map((result, index) => (
              <Alert
                key={index}
                message={result.message}
                type={getSeverityColor(result.severity) as any}
                icon={getSeverityIcon(result.severity)}
                showIcon
                style={{ marginBottom: 8 }}
              />
            ))}
          </div>
        )}
      </Card>

      <Card title="AI 写作辅助" style={{ marginBottom: 16 }}>
        <p>使用 AI 润色、扩写或总结你的内容。</p>
        
        <Space style={{ marginBottom: 16 }}>
          <Select
            value={enhanceType}
            onChange={setEnhanceType}
            style={{ width: 120 }}
            disabled={!aiAvailable}
          >
            <Select.Option value="polish">
              <EditOutlined /> 润色
            </Select.Option>
            <Select.Option value="expand">
              <ExpandOutlined /> 扩写
            </Select.Option>
            <Select.Option value="summary">
              <CompressOutlined /> 总结
            </Select.Option>
          </Select>
          <Button 
            type="primary" 
            icon={<ThunderboltOutlined />} 
            onClick={handleEnhanceWriting}
            loading={enhanceLoading}
            disabled={!aiAvailable}
          >
            生成示例
          </Button>
        </Space>

        {enhancedContent && (
          <Card size="small" style={{ marginTop: 16, background: '#f5f5f5' }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {enhancedContent}
            </pre>
          </Card>
        )}
      </Card>

      <Card 
        title="自定义提示词" 
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddPrompt}>添加</Button>}
        style={{ marginBottom: 16 }}
      >
        {customPrompts.length === 0 ? (
          <p style={{ color: '#999' }}>暂无自定义提示词，点击添加创建</p>
        ) : (
          <List
            dataSource={customPrompts}
            renderItem={(prompt) => (
              <List.Item
                actions={[
                  <Button key="run" type="link" icon={<PlayCircleOutlined />} onClick={() => handleRunCustomPrompt(prompt)} loading={customPromptLoading} disabled={!aiAvailable}>运行</Button>,
                  <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => handleEditPrompt(prompt)}>编辑</Button>,
                  <Popconfirm key="delete" title="确认删除?" onConfirm={() => handleDeletePrompt(prompt.id)}>
                    <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta title={prompt.name} description={prompt.prompt.slice(0, 50) + '...'} />
              </List.Item>
            )}
          />
        )}

        {customResult && (
          <Card size="small" style={{ marginTop: 16, background: '#f5f5f5' }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{customResult}</pre>
          </Card>
        )}
      </Card>

      <Card title="使用提示">
        <ul style={{ paddingLeft: 20 }}>
          <li>确保 Ollama 已安装并在后台运行</li>
          <li>首次使用建议下载 llama2 或 qwen 模型</li>
          <li>AI 功能完全本地运行，保护您的创作隐私</li>
        </ul>
      </Card>

      <Modal
        title={editingPrompt ? '编辑提示词' : '添加提示词'}
        open={isPromptModalVisible}
        onCancel={() => setIsPromptModalVisible(false)}
        onOk={handleSavePrompt}
        width={600}
      >
        <Form form={promptForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="如：生成战斗场景" />
          </Form.Item>
          <Form.Item name="prompt" label="提示词" rules={[{ required: true }]}>
            <Input.TextArea rows={6} placeholder="输入 AI 提示词，可以使用占位符如 {content}" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AIAssistant
