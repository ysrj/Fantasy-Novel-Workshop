import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Space, Select, Spin, message, Alert, Tabs, Divider, List, Empty } from 'antd'
import { 
  AudioOutlined, 
  VideoCameraOutlined, 
  ThunderboltOutlined, 
  CopyOutlined,
  SaveOutlined,
  RollbackOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'

interface Chapter {
  id: string
  title: string
  wordCount: number
}

function AICreator(): JSX.Element {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [aiAvailable, setAiAvailable] = useState(false)
  const [checking, setChecking] = useState(true)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapters, setSelectedChapters] = useState<string[]>([])
  const [lyricsStyle, setLyricsStyle] = useState('古风')
  const [scriptType, setScriptType] = useState('小说')
  const [generating, setGenerating] = useState(false)
  const [lyricsResult, setLyricsResult] = useState('')
  const [scriptResult, setScriptResult] = useState('')
  const [generatedHistory, setGeneratedHistory] = useState<{type: string, content: string, time: string}[]>([])

  useEffect(() => {
    checkAIStatus()
    loadChapters()
  }, [])

  const checkAIStatus = async (): Promise<void> => {
    setChecking(true)
    try {
      const available = await window.api.invoke<boolean>('ai:checkStatus')
      setAiAvailable(available)
    } catch {
      setAiAvailable(false)
    } finally {
      setChecking(false)
    }
  }

  const loadChapters = async (): Promise<void> => {
    if (!projectId) return
    try {
      const data = await window.api.invoke<Chapter[]>('writing:listChapters', projectId)
      setChapters(data)
    } catch (error) {
      message.error('加载章节失败')
    }
  }

  const generateLyrics = async (): Promise<void> => {
    if (!projectId) return
    if (selectedChapters.length === 0) {
      message.warning('请选择至少一个章节')
      return
    }

    setGenerating(true)
    setLyricsResult('')
    try {
      const result = await window.api.invoke<string | null>('ai:generateLyrics', projectId, lyricsStyle)
      if (result) {
        setLyricsResult(result)
        setGeneratedHistory(prev => [{
          type: `歌词（${lyricsStyle}）`,
          content: result,
          time: new Date().toLocaleString()
        }, ...prev])
        message.success('歌词生成完成')
      } else {
        message.warning('AI 不可用')
      }
    } catch (error) {
      message.error('生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const generateScript = async (): Promise<void> => {
    if (!projectId) return
    if (selectedChapters.length === 0) {
      message.warning('请选择至少一个章节')
      return
    }

    setGenerating(true)
    setScriptResult('')
    try {
      const result = await window.api.invoke<string | null>('ai:generateScript', projectId, scriptType)
      if (result) {
        setScriptResult(result)
        setGeneratedHistory(prev => [{
          type: `剧本（${scriptType}）`,
          content: result,
          time: new Date().toLocaleString()
        }, ...prev])
        message.success('剧本生成完成')
      } else {
        message.warning('AI 不可用')
      }
    } catch (error) {
      message.error('生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  }

  const saveToChapter = (content: string, type: string): void => {
    const title = type.includes('歌词') ? `【歌词】${new Date().toLocaleDateString()}` : `【剧本】${new Date().toLocaleDateString()}`
    navigate(`/workspace/${projectId}/writing`)
    message.info(`请在写作页面创建新章节后粘贴内容`)
  }

  const handleBack = (): void => {
    navigate(-1)
  }

  const toggleChapter = (chapterId: string): void => {
    setSelectedChapters(prev => 
      prev.includes(chapterId)
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    )
  }

  const selectAll = (): void => {
    setSelectedChapters(chapters.map(c => c.id))
  }

  const clearSelection = (): void => {
    setSelectedChapters([])
  }

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin tip="检查 AI 状态..." />
      </div>
    )
  }

  const tabItems = [
    {
      key: 'lyrics',
      label: (
        <span>
          <AudioOutlined /> 歌词生成
        </span>
      ),
      children: (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 8 }}>选择风格：</span>
            <Select
              value={lyricsStyle}
              onChange={setLyricsStyle}
              style={{ width: 120 }}
            >
              <Select.Option value="古风">古风</Select.Option>
              <Select.Option value="现代">现代</Select.Option>
              <Select.Option value="摇滚">摇滚</Select.Option>
              <Select.Option value="抒情">抒情</Select.Option>
              <Select.Option value="电子">电子</Select.Option>
            </Select>
          </div>
          
          {lyricsResult ? (
            <Card 
              title="生成的歌词" 
              extra={
                <Space>
                  <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(lyricsResult)}>
                    复制
                  </Button>
                  <Button icon={<SaveOutlined />} onClick={() => saveToChapter(lyricsResult, '歌词')}>
                    保存到章节
                  </Button>
                </Space>
              }
            >
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.8 }}>
                {lyricsResult}
              </pre>
            </Card>
          ) : (
            <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
              <AudioOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <p>点击"生成歌词"按钮开始创作</p>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'script',
      label: (
        <span>
          <VideoCameraOutlined /> 剧本生成
        </span>
      ),
      children: (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 8 }}>内容类型：</span>
            <Select
              value={scriptType}
              onChange={setScriptType}
              style={{ width: 120 }}
            >
              <Select.Option value="小说">小说</Select.Option>
              <Select.Option value="短篇">短篇</Select.Option>
              <Select.Option value="章节">章节</Select.Option>
            </Select>
          </div>

          {scriptResult ? (
            <Card 
              title="生成的剧本" 
              extra={
                <Space>
                  <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(scriptResult)}>
                    复制
                  </Button>
                  <Button icon={<SaveOutlined />} onClick={() => saveToChapter(scriptResult, '剧本')}>
                    保存到章节
                  </Button>
                </Space>
              }
            >
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.8 }}>
                {scriptResult}
              </pre>
            </Card>
          ) : (
            <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
              <VideoCameraOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <p>点击"生成剧本"按钮开始创作</p>
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>
          <ThunderboltOutlined style={{ marginRight: 8 }} />
          AI 创作工具
        </h2>
        <Button icon={<RollbackOutlined />} onClick={handleBack}>
          返回
        </Button>
      </div>

      {!aiAvailable && (
        <Alert
          type="warning"
          message="Ollama 未运行"
          description="AI 功能需要 Ollama 在后台运行。请安装并启动 Ollama 后刷新页面。"
          style={{ marginBottom: 16 }}
        />
      )}

      {aiAvailable && (
        <Alert
          type="success"
          message="AI 已就绪"
          style={{ marginBottom: 16 }}
        />
      )}

      <Card title="选择章节" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span>已选择 {selectedChapters.length} 个章节</span>
          <Space>
            <Button size="small" onClick={selectAll}>全选</Button>
            <Button size="small" onClick={clearSelection}>清空</Button>
          </Space>
        </div>
        {chapters.length === 0 ? (
          <Empty description="暂无章节，请先在正文中创建章节" />
        ) : (
          <List
            size="small"
            dataSource={chapters}
            renderItem={(chapter) => (
              <List.Item
                style={{ 
                  cursor: 'pointer',
                  background: selectedChapters.includes(chapter.id) ? '#e6f7ff' : 'transparent'
                }}
                onClick={() => toggleChapter(chapter.id)}
              >
                <Space>
                  {selectedChapters.includes(chapter.id) && <CheckCircleOutlined style={{ color: '#1890ff' }} />}
                  <span>{chapter.title}</span>
                  <span style={{ color: '#999', fontSize: 12 }}>({chapter.wordCount} 字)</span>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card style={{ flex: 1 }}>
        <Tabs items={tabItems} />
        
        <Divider />
        
        <div style={{ textAlign: 'center' }}>
          <Space size="large">
            <Button 
              type="primary" 
              size="large"
              icon={<AudioOutlined />}
              onClick={generateLyrics}
              loading={generating}
              disabled={!aiAvailable || selectedChapters.length === 0}
            >
              生成歌词
            </Button>
            <Button 
              type="primary" 
              size="large"
              icon={<VideoCameraOutlined />}
              onClick={generateScript}
              loading={generating}
              disabled={!aiAvailable || selectedChapters.length === 0}
            >
              生成剧本
            </Button>
          </Space>
        </div>
      </Card>

      {generatedHistory.length > 0 && (
        <Card title="历史记录" size="small" style={{ marginTop: 16 }}>
          <List
            size="small"
            dataSource={generatedHistory.slice(0, 5)}
            renderItem={(item) => (
              <List.Item>
                <Space>
                  <span>{item.type}</span>
                  <span style={{ color: '#999', fontSize: 12 }}>{item.time}</span>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  )
}

export default AICreator
