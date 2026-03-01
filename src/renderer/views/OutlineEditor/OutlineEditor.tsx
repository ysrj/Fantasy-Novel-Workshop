import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Input, Button, Space, message } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
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
  const { currentProject } = useProjectStore()
  const t = useSettingsStore(state => state.getTranslations())
  const [outline, setOutline] = useState<OutlineData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (projectId) {
      loadOutline()
    }
  }, [projectId])

  const loadOutline = async (): Promise<void> => {
    if (!projectId) return
    setLoading(true)
    try {
      const data = await window.api.invoke<OutlineData>('outline:load', projectId)
      setOutline(data)
    } catch (error) {
      message.error(t.error)
    } finally {
      setLoading(false)
    }
  }

  const saveOutline = async (): Promise<void> => {
    if (!projectId || !outline) return
    try {
      await window.api.invoke('outline:save', projectId, outline)
      message.success(t.saved)
    } catch (error) {
      message.error(t.error)
    }
  }

  if (!outline) {
    return <div>{t.loading}</div>
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>{t.outlineManagement}</h2>
        <Button type="primary" icon={<SaveOutlined />} onClick={saveOutline}>
          {t.save}
        </Button>
      </div>

      <Card title={t.storyOutline} style={{ marginBottom: 16 }}>
        <Input.TextArea
          rows={6}
          value={outline.storyOutline}
          onChange={(e) => setOutline({ ...outline, storyOutline: e.target.value })}
          placeholder={t.storyOutline}
        />
      </Card>

      <Card title={t.structurePlanning} style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {outline.structure.stages.map((stage, index) => (
            <div key={index} style={{ padding: 12, background: '#fafafa', borderRadius: 6 }}>
              <Input
                value={stage.name}
                onChange={(e) => {
                  const newStages = [...outline.structure.stages]
                  newStages[index].name = e.target.value
                  setOutline({ ...outline, structure: { ...outline.structure, stages: newStages } })
                }}
                placeholder={t.structurePlanning}
                style={{ marginBottom: 8, fontWeight: 600 }}
              />
              <Input.TextArea
                rows={2}
                value={stage.description}
                onChange={(e) => {
                  const newStages = [...outline.structure.stages]
                  newStages[index].description = e.target.value
                  setOutline({ ...outline, structure: { ...outline.structure, stages: newStages } })
                }}
                placeholder={stage.name}
              />
            </div>
          ))}
        </Space>
      </Card>

      <Card title={t.chapterOutline}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {outline.chapterOutlines.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>
              {t.noProjects}
            </div>
          ) : (
            outline.chapterOutlines.map((chapter, index) => (
              <div key={chapter.id} style={{ padding: 12, background: '#fafafa', borderRadius: 6 }}>
                <Space style={{ width: '100%', marginBottom: 8 }}>
                  <Input
                    value={chapter.title}
                    onChange={(e) => {
                      const newChapters = [...outline.chapterOutlines]
                      newChapters[index].title = e.target.value
                      setOutline({ ...outline, chapterOutlines: newChapters })
                    }}
                    placeholder={t.chapterTitle}
                    style={{ flex: 1 }}
                  />
                </Space>
                <Input.TextArea
                  rows={2}
                  value={chapter.summary}
                  onChange={(e) => {
                    const newChapters = [...outline.chapterOutlines]
                    newChapters[index].summary = e.target.value
                    setOutline({ ...outline, chapterOutlines: newChapters })
                  }}
                  placeholder={t.projectDescription}
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
