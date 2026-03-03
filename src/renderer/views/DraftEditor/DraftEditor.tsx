import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Input, Button, Space, message, List, Tag as AntTag, Empty, Modal, Select, Divider, Row, Col, Statistic, Spin, Form, Checkbox, Tooltip } from 'antd'
import { SaveOutlined, RollbackOutlined, FileTextOutlined, CheckCircleOutlined, SyncOutlined, ClockCircleOutlined, FormatPainterOutlined } from '@ant-design/icons'
import { publishApi, type RewriteSettings } from '../../api/publishApi'
import { ruleApi, type RuleResult } from '../../api/ruleApi'

const { TextArea } = Input

interface DraftItem {
  id: string
  chapterId: string
  title: string
  content: string
  wordCount: number
  lastModified: string
}

function DraftEditor(): JSX.Element {
  const { projectId } = useParams()
  const navigate = useNavigate()
  
  const [drafts, setDrafts] = useState<DraftItem[]>([])
  const [selectedDraft, setSelectedDraft] = useState<DraftItem | null>(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [publishModalVisible, setPublishModalVisible] = useState(false)
  const [validationResults, setValidationResults] = useState<RuleResult[]>([])
  const [validating, setValidating] = useState(false)
  const [rewriteSettings, setRewriteSettings] = useState<RewriteSettings>({
    style: 'web',
    tone: 'casual',
    removeRedundancy: true,
    enhanceDescription: true
  })

  useEffect(() => {
    if (projectId) {
      loadDrafts()
    }
  }, [projectId])

  useEffect(() => {
    if (selectedDraft) {
      setContent(selectedDraft.content)
      setTitle(selectedDraft.title)
      setHasChanges(false)
    }
  }, [selectedDraft])

  const loadDrafts = async (): Promise<void> => {
    if (!projectId) return
    setLoading(true)
    try {
      const data = await publishApi.getAllDrafts(projectId)
      setDrafts(data as DraftItem[] || [])
    } catch {
      message.error('加载草稿失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async (): Promise<void> => {
    if (!projectId || !selectedDraft) return
    setSaving(true)
    try {
      await publishApi.saveDraft(projectId, selectedDraft.chapterId, content, title)
      message.success('保存成功')
      setHasChanges(false)
      loadDrafts()
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setContent(e.target.value)
    setHasChanges(true)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setTitle(e.target.value)
    setHasChanges(true)
  }

  const handleValidate = async (): Promise<void> => {
    if (!content.trim()) {
      message.warning('请先输入内容')
      return
    }
    setValidating(true)
    try {
      const results = await ruleApi.validateContent(projectId!, content)
      setValidationResults(results || [])
      if (results.length === 0) {
        message.success('验证通过，没有发现问题')
      } else {
        message.warning(`发现 ${results.length} 个问题`)
      }
    } catch {
      message.error('验证失败')
    } finally {
      setValidating(false)
    }
  }

  const handlePublish = async (): Promise<void> => {
    if (!selectedDraft) return
    setPublishModalVisible(false)
    setSaving(true)
    try {
      await publishApi.generateFromDraft(selectedDraft.id, rewriteSettings)
      message.success('发布版本生成成功')
    } catch {
      message.error('发布失败')
    } finally {
      setSaving(false)
    }
  }

  const getWordCount = (text: string): number => {
    return text.trim().replace(/\s+/g, '').length
  }

  const severityColors: Record<string, string> = {
    error: 'red',
    warning: 'orange',
    info: 'blue'
  }

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}><FileTextOutlined /> 草稿管理</h2>
        <Space>
          <Button icon={<RollbackOutlined />} onClick={() => navigate(-1)}>返回</Button>
          {hasChanges && (
            <>
              <Button onClick={() => { if (selectedDraft) { setContent(selectedDraft.content); setTitle(selectedDraft.title); setHasChanges(false) } }}>取消</Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveDraft} loading={saving}>保存</Button>
            </>
          )}
        </Space>
      </div>

      <Row gutter={16} style={{ flex: 1 }}>
        <Col span={5}>
          <Card 
            title="草稿列表" 
            extra={<Button size="small" type="link" icon={<SyncOutlined />} onClick={loadDrafts}>刷新</Button>}
            style={{ height: '100%', overflow: 'auto' }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
            ) : drafts.length > 0 ? (
              <List
                dataSource={drafts}
                renderItem={item => (
                  <List.Item
                    style={{ 
                      cursor: 'pointer', 
                      padding: '12px',
                      background: selectedDraft?.id === item.id ? '#e6f7ff' : undefined,
                      borderLeft: selectedDraft?.id === item.id ? '3px solid #1890ff' : undefined
                    }}
                    onClick={() => setSelectedDraft(item)}
                  >
                    <List.Item.Meta
                      title={item.title || '无标题'}
                      description={
                        <div>
                          <span style={{ fontSize: 12, color: '#888' }}>
                            <ClockCircleOutlined /> {new Date(item.lastModified).toLocaleDateString()}
                          </span>
                          <br />
                          <span style={{ fontSize: 12, color: '#888' }}>
                            {item.wordCount} 字
                          </span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无草稿" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
        
        <Col span={14}>
          <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedDraft ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Input
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="章节标题"
                    style={{ fontSize: 18, fontWeight: 'bold' }}
                  />
                </div>
                <TextArea
                  value={content}
                  onChange={handleContentChange}
                  placeholder="在此输入章节内容..."
                  style={{ flex: 1, fontSize: 16, lineHeight: 1.8 }}
                  autoSize={{ minRows: 20 }}
                />
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#888' }}>字数：{getWordCount(content)}</span>
                  <Space>
                    <Tooltip title="运行规则检查">
                      <Button icon={<CheckCircleOutlined />} onClick={handleValidate} loading={validating}>验证</Button>
                    </Tooltip>
                    <Button type="primary" icon={<FormatPainterOutlined />} onClick={() => setPublishModalVisible(true)}>
                      生成发布版
                    </Button>
                  </Space>
                </div>
              </>
            ) : (
              <Empty description="请从左侧选择一个草稿" style={{ marginTop: 100 }} />
            )}
          </Card>
        </Col>

        <Col span={5}>
          <Card title="验证结果" style={{ height: '100%', overflow: 'auto' }}>
            {validationResults.length > 0 ? (
              <div>
                <Statistic 
                  title="问题数" 
                  value={validationResults.length} 
                  valueStyle={{ color: validationResults.some(r => r.severity === 'error') ? '#ff4d4f' : '#faad14' }}
                />
                <Divider />
                {validationResults.map((result, idx) => (
                  <div key={idx} style={{ marginBottom: 12, padding: 8, background: '#fafafa', borderRadius: 4, borderLeft: `3px solid ${severityColors[result.severity]}` }}>
                    <div style={{ display: 'block', marginBottom: 4 }}>
                      <AntTag color={severityColors[result.severity]} style={{ marginRight: 4 }}>{result.severity}</AntTag>
                      {result.ruleName}
                    </div>
                    <span style={{ fontSize: 12, color: '#888' }}>{result.message}</span>
                    {result.suggestions && result.suggestions.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        {result.suggestions.map((s: string, i: number) => (
                          <span key={i} style={{ fontSize: 11, color: '#888', display: 'block' }}>• {s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="点击验证按钮检查内容" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="生成发布版本"
        open={publishModalVisible}
        onCancel={() => setPublishModalVisible(false)}
        onOk={handlePublish}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="风格">
            <Select 
              value={rewriteSettings.style} 
              onChange={v => setRewriteSettings({ ...rewriteSettings, style: v })}
            >
              <Select.Option value="traditional">传统武侠</Select.Option>
              <Select.Option value="simplified">简体网络</Select.Option>
              <Select.Option value="web">网络小说</Select.Option>
              <Select.Option value="raw">原文</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="语气">
            <Select 
              value={rewriteSettings.tone} 
              onChange={v => setRewriteSettings({ ...rewriteSettings, tone: v })}
            >
              <Select.Option value="formal">正式</Select.Option>
              <Select.Option value="casual">轻松</Select.Option>
              <Select.Option value="humorous">幽默</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="优化选项">
            <Checkbox 
              checked={rewriteSettings.removeRedundancy}
              onChange={e => setRewriteSettings({ ...rewriteSettings, removeRedundancy: e.target.checked })}
            >
              去除冗余
            </Checkbox>
            <br />
            <Checkbox 
              checked={rewriteSettings.enhanceDescription}
              onChange={e => setRewriteSettings({ ...rewriteSettings, enhanceDescription: e.target.checked })}
            >
              增强描写
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DraftEditor
