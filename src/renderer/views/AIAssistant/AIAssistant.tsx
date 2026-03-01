import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Button, Space, Tag, Spin, message, Alert, Select, Divider } from 'antd'
import { RobotOutlined, CheckCircleOutlined, WarningOutlined, InfoCircleOutlined, ThunderboltOutlined, EditOutlined, ExpandOutlined, compressOutlined } from '@ant-design/icons'

interface AICheckResult {
  type: string
  severity: 'info' | 'warning' | 'error'
  message: string
  location?: string
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

  useEffect(() => {
    checkAIStatus()
  }, [])

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
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
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

      <Card title="AI 写作辅助">
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
              <compressOutlined /> 总结
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

      <Card title="使用提示" style={{ marginTop: 16 }}>
        <ul style={{ paddingLeft: 20 }}>
          <li>确保 Ollama 已安装并在后台运行</li>
          <li>首次使用建议下载 llama2 或 qwen 模型</li>
          <li>AI 功能完全本地运行，保护您的创作隐私</li>
        </ul>
      </Card>
    </div>
  )
}

export default AIAssistant
