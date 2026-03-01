import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Space, List, Input, Modal, message } from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined, FileTextOutlined } from '@ant-design/icons'
import { useEditorStore } from '../../stores/editorStore'

interface Chapter {
  id: string
  number: number
  title: string
  fileName: string
  wordCount: number
}

function WritingEditor(): JSX.Element {
  const { projectId } = useParams()
  const { currentChapterId, content, setCurrentChapter, setContent, isDirty, setDirty } = useEditorStore()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [newChapterTitle, setNewChapterTitle] = useState('')

  useEffect(() => {
    if (projectId) {
      loadChapters()
    }
  }, [projectId])

  const loadChapters = async (): Promise<void> => {
    if (!projectId) return
    try {
      const data = await window.api.invoke<Chapter[]>('writing:listChapters', projectId)
      setChapters(data)
    } catch (error) {
      message.error('加载章节失败')
    }
  }

  const loadChapterContent = async (chapterId: string): Promise<void> => {
    if (!projectId) return
    try {
      const content = await window.api.invoke<string>('writing:getChapter', projectId, chapterId)
      setCurrentChapter(chapterId)
      setContent(content || '')
      setDirty(false)
    } catch (error) {
      message.error('加载章节内容失败')
    }
  }

  const saveChapter = async (): Promise<void> => {
    if (!projectId || !currentChapterId) return
    try {
      await window.api.invoke('writing:saveChapter', projectId, currentChapterId, content)
      setDirty(false)
      message.success('章节已保存')
      loadChapters()
    } catch (error) {
      message.error('保存章节失败')
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
          }
          message.success('章节已删除')
        } catch (error) {
          message.error('删除章节失败')
        }
      }
    })
  }

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
                  <Button
                    key="delete"
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => deleteChapter(chapter.id, e)}
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={<FileTextOutlined />}
                  title={<span style={{ fontSize: 14 }}>{chapter.title}</span>}
                  description={<span style={{ fontSize: 12 }}>{chapter.wordCount} 字</span>}
                />
              </List.Item>
            )}
          />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
        {currentChapterId ? (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>
                {chapters.find((c) => c.id === currentChapterId)?.title}
                {isDirty && <span style={{ color: '#faad14', marginLeft: 8 }}>（未保存）</span>}
              </span>
              <Button type="primary" icon={<SaveOutlined />} onClick={saveChapter}>
                保存
              </Button>
            </div>
            <div style={{ flex: 1, padding: 24 }}>
              <textarea
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: 16,
                  lineHeight: 1.8,
                  fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
                  resize: 'none'
                }}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  setDirty(true)
                }}
                placeholder="开始写作..."
              />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
            选择或创建章节开始写作
          </div>
        )}
      </div>

      <Modal
        title="新建章节"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={createChapter}
      >
        <Input
          value={newChapterTitle}
          onChange={(e) => setNewChapterTitle(e.target.value)}
          placeholder="输入章节标题"
          onPressEnter={createChapter}
        />
      </Modal>
    </div>
  )
}

export default WritingEditor
