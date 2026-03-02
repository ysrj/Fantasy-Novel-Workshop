import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { Popover, Input, Button, Space, Slider, message } from 'antd'
import { FullscreenOutlined, PictureOutlined, SettingOutlined } from '@ant-design/icons'

export interface TipTapEditorProps {
  value: string
  onChange?: (value: string) => void
  fontSize?: number
  placeholder?: string
  readOnly?: boolean
  immersiveMode?: boolean
  typewriterMode?: boolean
  backgroundImage?: string
  characters?: { id: string; name: string }[]
  locations?: { id: string; name: string }[]
  realms?: { id: string; name: string }[]
  techniques?: { id: string; name: string }[]
  chapters?: { id: string; title: string }[]
  onSave?: (value: string) => void
}

function TipTapEditor({
  value,
  onChange,
  fontSize = 18,
  placeholder: placeholderText = '开始写作...',
  readOnly = false,
  immersiveMode: initialImmersive = false,
  typewriterMode: initialTypewriter = false,
  backgroundImage: initialBg = '',
  characters = [],
  locations = [],
  realms = [],
  techniques = [],
  chapters = [],
  onSave
}: TipTapEditorProps): JSX.Element {
  const [immersive, setImmersive] = useState(initialImmersive)
  const [typewriter, setTypewriter] = useState(initialTypewriter)
  const [bgImage, setBgImage] = useState(initialBg)
  const [editorFontSize, setEditorFontSize] = useState(fontSize)
  const [showSettings, setShowSettings] = useState(false)
  const [showMentionMenu, setShowMentionMenu] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })

  const suggestions = useMemo(() => {
    const items: { label: string; insertText: string; type: string }[] = []
    characters.forEach(c => items.push({ label: `@${c.name}`, insertText: `[[角色:${c.name}]]`, type: 'character' }))
    locations.forEach(l => items.push({ label: `@${l.name}`, insertText: `[[地点:${l.name}]]`, type: 'location' }))
    realms.forEach(r => items.push({ label: `境界:${r.name}`, insertText: r.name, type: 'realm' }))
    techniques.forEach(t => items.push({ label: `功法:${t.name}`, insertText: t.name, type: 'technique' }))
    chapters.forEach(c => items.push({ label: `#${c.title}`, insertText: `\n## ${c.title}\n`, type: 'chapter' }))
    return items
  }, [characters, locations, realms, techniques, chapters])

  const filteredSuggestions = useMemo(() => {
    if (!mentionQuery) return suggestions.slice(0, 10)
    const q = mentionQuery.toLowerCase()
    return suggestions.filter(s => s.label.toLowerCase().includes(q)).slice(0, 10)
  }, [suggestions, mentionQuery])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: { HTMLAttributes: { class: 'code-block' } }
      }),
      Placeholder.configure({
        placeholder: placeholderText
      }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true })
    ],
    content: value,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none`,
        style: `
          font-size: ${editorFontSize}px;
          line-height: 1.8;
          padding: 20px 40px;
          max-width: 800px;
          margin: 0 auto;
          min-height: 100%;
        `
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const markdown = convertToMarkdown(html)
      onChange?.(markdown)
    }
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  const convertToMarkdown = (html: string): string => {
    let md = html
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6>(.*?)<\/h6>/gi, '###### $1\n\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i>(.*?)<\/i>/gi, '*$1*')
      .replace(/<code>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre>(.*?)<\/pre>/gi, '```\n$1\n```\n')
      .replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n')
      .replace(/<ul>/gi, '').replace(/<\/ul>/gi, '\n')
      .replace(/<ol>/gi, '').replace(/<\/ol>/gi, '\n')
      .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/&nbsp;/g, ' ')
      .trim()
    return md
  }

  const handleSave = useCallback(() => {
    if (editor) {
      const content = convertToMarkdown(editor.getHTML())
      onSave?.(content)
      message.success('已保存')
    }
  }, [editor, onSave])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  const insertMention = useCallback((insertText: string) => {
    if (editor) {
      editor.insertContent(insertText)
      setShowMentionMenu(false)
    }
  }, [editor])

  const editorStyle: React.CSSProperties = {
    minHeight: '100%',
    height: '100%',
    backgroundImage: bgImage ? `url(${bgImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    transition: 'all 0.3s ease'
  }

  const contentStyle: React.CSSProperties = {
    maxWidth: 800,
    margin: '0 auto',
    padding: immersive ? '60px 40px' : '20px 40px',
    minHeight: '100%',
    background: immersive ? 'rgba(255,255,255,0.95)' : undefined,
    boxShadow: immersive ? '0 0 50px rgba(0,0,0,0.1)' : undefined
  }

  const settingsContent = (
    <div style={{ width: 200 }}>
      <div style={{ marginBottom: 16 }}>
        <span>字号: {editorFontSize}px</span>
        <Slider
          min={12}
          max={28}
          value={editorFontSize}
          onChange={setEditorFontSize}
        />
      </div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>沉浸模式</span>
          <Switch checked={immersive} onChange={setImmersive} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>打字机模式</span>
          <Switch checked={typewriter} onChange={setTypewriter} />
        </div>
        <div>
          <Input
            placeholder="背景图片URL"
            value={bgImage}
            onChange={e => setBgImage(e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>
      </Space>
    </div>
  )

  return (
    <div style={editorStyle}>
      <div style={{ 
        position: 'absolute', 
        top: 16, 
        right: immersive ? 16 : 60, 
        zIndex: 100,
        display: 'flex',
        gap: 8
      }}>
        {onSave && (
          <Button onClick={handleSave} size="small">
            保存
          </Button>
        )}
        <Popover
          content={settingsContent}
          title="编辑器设置"
          trigger="click"
          open={showSettings}
          onOpenChange={setShowSettings}
        >
          <Button icon={<SettingOutlined />} size="small" />
        </Popover>
      </div>

      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div style={{ 
            background: '#333', 
            borderRadius: 6, 
            padding: '4px 8px',
            display: 'flex',
            gap: 4
          }}>
            <Button
              size="small"
              type={editor.isActive('bold') ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              B
            </Button>
            <Button
              size="small"
              type={editor.isActive('italic') ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              I
            </Button>
            <Button
              size="small"
              type={editor.isActive('heading', { level: 2 }) ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              H2
            </Button>
            <Button
              size="small"
              type={editor.isActive('bulletList') ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              •
            </Button>
          </div>
        </BubbleMenu>
      )}

      <div style={contentStyle}>
        <EditorContent editor={editor} />
      </div>

      {showMentionMenu && filteredSuggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: mentionPosition.top,
          left: mentionPosition.left,
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxHeight: 200,
          overflow: 'auto',
          zIndex: 1000,
          minWidth: 150
        }}>
          {filteredSuggestions.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: idx < filteredSuggestions.length - 1 ? '1px solid #eee' : undefined
              }}
              onClick={() => insertMention(item.insertText)}
              onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              <div style={{ fontWeight: 500 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{item.type}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TipTapEditor
