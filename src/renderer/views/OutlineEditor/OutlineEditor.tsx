import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Input, Button, Space, message } from 'antd'
import { SaveOutlined, RollbackOutlined, UndoOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useProjectStore } from '../../stores/projectStore'
import { useSettingsStore } from '../../stores/settingsStore'

interface OutlineData {
  storyOutline: string
  structure: {
    type: string
    stages: { name: string; description: string; chapters: string[] }[]
  }
  chapterOutlines: { id: string; number: number; title: string; summary: string }[]
}

function OutlineEditor(): JSX.Element {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { currentProject } = useProjectStore()
  const t = useSettingsStore(state => state.getTranslations())
  const [outline, setOutline] = useState<OutlineData | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [initialData, setInitialData] = useState<OutlineData | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (projectId) {
      loadOutline()
    }
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current)
    }
  }, [projectId])

  useEffect(() => {
    if (hasChanges && projectId) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        autoSave()
      }, 3000)
    }
  }, [hasChanges, outline])

  const loadOutline = async (): Promise<void> => {
    if (!projectId) return
    setLoading(true)
    try {
      const data = await window.api.invoke<OutlineData>('outline:load', projectId)
      setOutline(data)
      setInitialData(JSON.parse(JSON.stringify(data)))
      setLastSaved(new Date().toLocaleTimeString())
    } catch (error) {
      message.error('加载大纲失败')
    } finally {
      setLoading(false)
    }
  }

  const autoSave = useCallback(async (): Promise<void> => {
    if (!projectId || !outline || saving) return
    
    setSaving(true)
    try {
      await window.api.invoke('outline:save', projectId, outline)
      setInitialData(JSON.parse(JSON.stringify(outline)))
      setHasChanges(false)
      setLastSaved(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Auto save failed:', error)
    } finally {
      setSaving(false)
    }
  }, [projectId, outline, saving])

  const handleChange = (): void => {
    setHasChanges(true)
  }

  const saveOutline = async (): Promise<void> => {
    if (!projectId || !outline) return
    setSaving(true)
    try {
      await window.api.invoke('outline:save', projectId, outline)
      setInitialData(JSON.parse(JSON.stringify(outline)))
      setHasChanges(false)
      setLastSaved(new Date().toLocaleTimeString())
      message.success('大纲已保存')
    } catch (error) {
      message.error('保存大纲失败')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = (): void => {
    if (initialData) {
      setOutline(JSON.parse(JSON.stringify(initialData)))
      setHasChanges(false)
      message.info('已重置')
    }
  }

  const handleCancel = (): void => {
    if (initialData) {
      setOutline(JSON.parse(JSON.stringify(initialData)))
      setHasChanges(false)
      message.info('已取消更改')
    }
  }

  const handleBack = (): void => {
    if (hasChanges) {
      message.warning('您有未保存的更改，请先保存')
    } else {
      navigate(-1)
    }
  }

  if (!outline) {
    return <div>{t.loading}</div>
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>大纲管理</h2>
          {lastSaved && (
            <span style={{ fontSize: 12, color: '#999' }}>
              <CheckCircleOutlined style={{ marginRight: 4 }} />
              已自动保存: {lastSaved}
            </span>
          )}
        </div>
        <Space>
          <Button icon={<RollbackOutlined />} onClick={handleBack}>
            返回
          </Button>
          {hasChanges && (
            <Button onClick={handleCancel}>
              取消
            </Button>
          )}
          <Button icon={<UndoOutlined />} onClick={handleReset}>
            重置
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={saveOutline}
            loading={saving}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </Space>
      </div>

      <Card title="故事大纲" style={{ marginBottom: 16 }}>
        <Input.TextArea
          rows={6}
          value={outline.storyOutline}
          onChange={(e) => {
            setOutline({ ...outline, storyOutline: e.target.value })
            handleChange()
          }}
          placeholder="输入故事整体大纲..."
        />
      </Card>

      <Card title="结构规划" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {outline.structure.stages.map((stage, index) => (
            <div key={index} style={{ padding: 12, background: '#fafafa', borderRadius: 6 }}>
              <Input
                value={stage.name}
                onChange={(e) => {
                  const newStages = [...outline.structure.stages]
                  newStages[index].name = e.target.value
                  setOutline({ ...outline, structure: { ...outline.structure, stages: newStages } })
                  handleChange()
                }}
                placeholder="阶段名称"
                style={{ marginBottom: 8, fontWeight: 600 }}
              />
              <Input.TextArea
                rows={2}
                value={stage.description}
                onChange={(e) => {
                  const newStages = [...outline.structure.stages]
                  newStages[index].description = e.target.value
                  setOutline({ ...outline, structure: { ...outline.structure, stages: newStages } })
                  handleChange()
                }}
                placeholder="阶段描述"
              />
            </div>
          ))}
        </Space>
      </Card>

      <Card title="章节大纲">
        <Space direction="vertical" style={{ width: '100%' }}>
          {outline.chapterOutlines.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>
              暂无章节大纲
            </div>
          ) : (
            outline.chapterOutlines.map((chapter, index) => (
              <div key={chapter.id} style={{ padding: 12, background: '#fafafa', borderRadius: 6 }}>
                <Input
                  value={chapter.title}
                  onChange={(e) => {
                    const newChapters = [...outline.chapterOutlines]
                    newChapters[index].title = e.target.value
                    setOutline({ ...outline, chapterOutlines: newChapters })
                    handleChange()
                  }}
                  placeholder="章节标题"
                  style={{ marginBottom: 8 }}
                />
                <Input.TextArea
                  rows={2}
                  value={chapter.summary}
                  onChange={(e) => {
                    const newChapters = [...outline.chapterOutlines]
                    newChapters[index].summary = e.target.value
                    setOutline({ ...outline, chapterOutlines: newChapters })
                    handleChange()
                  }}
                  placeholder="章节概要"
                />
              </div>
            ))
          )}
        </Space>
      </Card>
    </div>
  )
}

export default OutlineEditor
