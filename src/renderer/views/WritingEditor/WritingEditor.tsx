import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Space, List, Modal, message, Tabs, Select } from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined, FileTextOutlined, RollbackOutlined, CheckCircleOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEditorStore } from '../../stores/editorStore'
import { useSettingsStore } from '../../stores/settingsStore'
import RichEditor from '../../components/RichEditor/RichEditor'
import type { editor } from 'monaco-editor'

interface Chapter {
  id: string
  number: number
  title: string
  fileName: string
  wordCount: number
}

interface EntityOption {
  id: string
  name: string
}

function WritingEditor(): JSX.Element {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { currentChapterId, content, setCurrentChapter, setContent, isDirty, setDirty } = useEditorStore()
  const settings = useSettingsStore()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [initialContent, setInitialContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<'edit' | 'preview'>('edit')
  const [fontSize, setFontSize] = useState(settings.fontSize || 16)
  const [characters, setCharacters] = useState<EntityOption[]>([])
  const [locations, setLocations] = useState<EntityOption[]>([])
  const [realms, setRealms] = useState<EntityOption[]>([])
  const [techniques, setTechniques] = useState<EntityOption[]>([])
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (projectId) {
      loadChapters()
    }
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [projectId])

  useEffect(() => {
    if (content && currentChapterId && isDirty) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        autoSave()
      }, 30000)
    }
  }, [content, isDirty, currentChapterId])

  const loadChapters = async (): Promise<void> => {
    if (!projectId) return
    try {
      const [chapterData, worldData, charData] = await Promise.all([
        window.api.invoke<Chapter[]>('writing:listChapters', projectId),
        window.api.invoke<any>('world:load', projectId),
        window.api.invoke<EntityOption[]>('character:list', projectId)
      ])
      setChapters(chapterData)
      setCharacters(charData || [])
      if (worldData) {
        setLocations((worldData.geography?.locations || []).map((l: any) => ({ id: l.id, name: l.name })))
        setRealms((worldData.cultivation?.realms || []).map((r: any) => ({ id: r.id, name: r.name })))
        setTechniques((worldData.cultivation?.techniques || []).map((t: any) => ({ id: t.id, name: t.name })))
      }
    } catch (error) {
      message.error('加载数据失败')
    }
  }

  const autoSave = useCallback(async (): Promise<void> => {
    if (!projectId || !currentChapterId || !isDirty || saving) return
    
    setSaving(true)
    try {
      await window.api.invoke('writing:saveChapter', projectId, currentChapterId, content)
      setInitialContent(content)
      setDirty(false)
      setLastSaved(new Date().toLocaleTimeString())
      loadChapters()
    } catch (error) {
      console.error('Auto save failed:', error)
    } finally {
      setSaving(false)
    }
  }, [projectId, currentChapterId, content, isDirty, saving])

  const loadChapterContent = async (chapterId: string): Promise<void> => {
    if (!projectId) return
    
    if (isDirty) {
      message.warning('请先保存当前章节的更改')
      return
    }
    
    try {
      const chapterContent = await window.api.invoke<string>('writing:getChapter', projectId, chapterId)
      setCurrentChapter(chapterId)
      setContent(chapterContent || '')
      setInitialContent(chapterContent || '')
      setDirty(false)
      setLastSaved(new Date().toLocaleTimeString())
    } catch (error) {
      message.error('加载章节内容失败')
    }
  }

  const saveChapter = async (): Promise<void> => {
    if (!projectId || !currentChapterId) return
    setSaving(true)
    try {
      await window.api.invoke('writing:saveChapter', projectId, currentChapterId, content)
      setInitialContent(content)
      setDirty(false)
      setLastSaved(new Date().toLocaleTimeString())
      message.success('章节已保存')
      loadChapters()
    } catch (error) {
      message.error('保存章节失败')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = (): void => {
    setContent(initialContent)
    setDirty(false)
    message.info('已重置')
  }

  const handleCancel = (): void => {
    setContent(initialContent)
    setDirty(false)
    message.info('已取消更改')
  }

  const handleBack = (): void => {
    if (isDirty) {
      message.warning('您有未保存的更改')
    } else {
      navigate(-1)
    }
  }

  const createChapter = async (): Promise<void> => {
    if (!projectId || !newChapterTitle.trim()) return
    try {
      const newChapter = await window.api.invoke<Chapter>('writing:createChapter', projectId, newChapterTitle)
      setChapters([...chapters, newChapter])
      setIsModalVisible(false)
      setNewChapterTitle('')
      loadChapterContent(newChapter.id)
      message.success('章节已创建')
    } catch (error) {
      message.error('创建章节失败')
    }
  }

  const deleteChapter = async (chapterId: string, e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    if (!projectId) return
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个章节吗？',
      onOk: async () => {
        try {
          await window.api.invoke('writing:deleteChapter', projectId, chapterId)
          setChapters(chapters.filter((c) => c.id !== chapterId))
          if (currentChapterId === chapterId) {
            setCurrentChapter(null)
            setContent('')
            setInitialContent('')
          }
          message.success('章节已删除')
        } catch (error) {
          message.error('删除章节失败')
        }
      }
    })
  }

  const handleEditorChange = (value: string): void => {
    setContent(value)
    setDirty(true)
  }

  const handleEditorMount = (editor: editor.IStandaloneCodeEditor): void => {
    editorRef.current = editor
    editor.focus()
  }

  const handleSave = (_value: string): void => {
    saveChapter()
  }

  const tabItems = [
    {
      key: 'edit',
      label: <span><EditOutlined /> 编辑</span>,
      children: (
        <RichEditor
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          onSave={handleSave}
          language="markdown"
          fontSize={fontSize}
          theme="vs"
          placeholder="开始写作..."
          wordWrap="on"
          lineNumbers="off"
          minimap={false}
          folding={false}
          characters={characters}
          locations={locations}
          realms={realms}
          techniques={techniques}
          chapters={chapters.map(c => ({ id: c.id, title: c.title }))}
        />
      )
    },
    {
      key: 'preview',
      label: <span><EyeOutlined /> 预览</span>,
      children: (
        <div className="markdown-preview" style={{ padding: 24, height: '100%', overflow: 'auto', background: '#fff' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || '*无可预览内容*'}
          </ReactMarkdown>
        </div>
      )
    }
  ]

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      <div style={{ width: 260, background: '#fff', borderRight: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>章节列表</span>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
            新建
          </Button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <List
            dataSource={chapters}
            renderItem={(chapter) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: currentChapterId === chapter.id ? '#e6f7ff' : 'transparent'
                }}
                onClick={() => loadChapterContent(chapter.id)}
                actions={[
                  <Button key="delete" type="text" danger size="small" icon={<DeleteOutlined />} onClick={(e) => deleteChapter(chapter.id, e)} />
                ]}
              >
                <List.Item.Meta avatar={<FileTextOutlined />} title={<span style={{ fontSize: 14 }}>{chapter.title}</span>} description={<span style={{ fontSize: 12 }}>{chapter.wordCount} 字</span>} />
              </List.Item>
            )}
          />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
        {currentChapterId ? (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Button icon={<RollbackOutlined />} onClick={handleBack}>返回</Button>
                <span style={{ fontWeight: 500 }}>
                  {chapters.find((c) => c.id === currentChapterId)?.title}
                  {isDirty && <span style={{ color: '#faad14', marginLeft: 8 }}>（未保存）</span>}
                </span>
                {lastSaved && !isDirty && <span style={{ fontSize: 12, color: '#999' }}><CheckCircleOutlined style={{ marginRight: 4 }} />{lastSaved}</span>}
              </Space>
              <Space>
                <Select value={fontSize} onChange={setFontSize} style={{ width: 70 }} options={[{ value: 14, label: '14px' }, { value: 16, label: '16px' }, { value: 18, label: '18px' }, { value: 20, label: '20px' }]} />
                {isDirty && (
                  <>
                    <Button onClick={handleCancel}>取消</Button>
                    <Button onClick={handleReset}>重置</Button>
                  </>
                )}
                <Button type="primary" icon={<SaveOutlined />} onClick={saveChapter} loading={saving}>
                  {saving ? '保存中' : '保存'}
                </Button>
              </Space>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Tabs activeKey={editMode} onChange={(key) => setEditMode(key as 'edit' | 'preview')} items={tabItems} style={{ height: '100%' }} tabBarStyle={{ margin: 0, paddingLeft: 16 }} />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>选择或创建章节开始写作</div>
        )}
      </div>

      <Modal title="新建章节" open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={createChapter}>
        <input value={newChapterTitle} onChange={(e) => setNewChapterTitle(e.target.value)} placeholder="输入章节标题" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 4 }} />
      </Modal>
    </div>
  )
}

export default WritingEditor
