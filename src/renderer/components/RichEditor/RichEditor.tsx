import { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { Popover, Input, Button, Space, Switch, Slider, message } from 'antd'
import { FullscreenOutlined, PictureOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons'

export interface EditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string
  theme?: 'vs' | 'vs-dark' | 'hc-black'
  fontSize?: number
  lineHeight?: number
  minHeight?: number | string
  maxHeight?: number | string
  readOnly?: boolean
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded'
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval'
  minimap?: boolean
  scrollBeyondLastLine?: boolean
  automaticLayout?: boolean
  tabSize?: number
  folding?: boolean
  placeholder?: string
  loading?: React.ReactNode
  onSave?: (value: string) => void
  onMount?: (editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => void
  immersiveMode?: boolean
  typewriterMode?: boolean
  backgroundImage?: string
  characters?: { id: string; name: string }[]
  locations?: { id: string; name: string }[]
  realms?: { id: string; name: string }[]
  techniques?: { id: string; name: string }[]
  chapters?: { id: string; title: string }[]
}

function RichEditor({
  value,
  onChange,
  language = 'markdown',
  theme = 'vs',
  fontSize = 18,
  lineHeight = 32,
  minHeight = '100%',
  maxHeight = '100%',
  readOnly = false,
  wordWrap = 'on',
  lineNumbers = 'off',
  minimap = false,
  scrollBeyondLastLine = false,
  automaticLayout = true,
  tabSize = 2,
  folding = false,
  placeholder = '开始写作...',
  loading,
  onSave,
  onMount,
  immersiveMode: initialImmersive = false,
  typewriterMode: initialTypewriter = false,
  backgroundImage: initialBg = '',
  characters = [],
  locations = [],
  realms = [],
  techniques = [],
  chapters = []
}: EditorProps): JSX.Element {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const [mounted, setMounted] = useState(false)
  const [immersive, setImmersive] = useState(initialImmersive)
  const [typewriter, setTypewriter] = useState(initialTypewriter)
  const [bgImage, setBgImage] = useState(initialBg)
  const [editorFontSize, setEditorFontSize] = useState(fontSize)
  const [showSettings, setShowSettings] = useState(false)
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null)

  const allSuggestions = useMemo(() => {
    const items: { label: string; insertText: string; type: string }[] = []
    characters.forEach(c => items.push({ label: `@${c.name}`, insertText: `[[角色:${c.name}]]`, type: 'character' }))
    locations.forEach(l => items.push({ label: `@${l.name}`, insertText: `[[地点:${l.name}]]`, type: 'location' }))
    realms.forEach(r => items.push({ label: `境界:${r.name}`, insertText: r.name, type: 'realm' }))
    techniques.forEach(t => items.push({ label: `功法:${t.name}`, insertText: t.name, type: 'technique' }))
    chapters.forEach(c => items.push({ label: `#${c.title}`, insertText: `\n## ${c.title}\n`, type: 'chapter' }))
    return items
  }, [characters, locations, realms, techniques, chapters])

  const handleEditorDidMount: OnMount = useCallback((edtr, monaco) => {
    editorRef.current = edtr
    monacoRef.current = monaco
    setMounted(true)

    monaco.languages.setLanguageConfiguration('markdown', {
      wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
      comments: { blockComment: ['<!--', '-->'] },
      brackets: [['{', '}'], ['[', ']'], ['(', ')']],
      autoClosingPairs: [
        { open: '[', close: ']' }, { open: '(', close: ')' }, { open: '"', close: '"' },
        { open: "'", close: "'" }, { open: '`', close: '`' }, { open: '*', close: '*' }, { open: '_', close: '_' }
      ]
    })

    monaco.languages.registerCompletionItemProvider('markdown', {
      provideCompletionItems: (model: any, position: any) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        })
        
        const word = textUntilPosition.match(/@(\w*)$/) || textUntilPosition.match(/#(\w*)$/) || textUntilPosition.match(/\?(\w*)$/)
        
        if (word) {
          const query = word[1]
          const filtered = allSuggestions.filter(s => s.label.toLowerCase().includes(query.toLowerCase()))
          
          return {
            suggestions: filtered.slice(0, 10).map(s => ({
              label: s.label,
              kind: monaco.languages.CompletionItemKind.Reference,
              insertText: s.insertText,
              detail: s.type
            }))
          }
        }
        return { suggestions: [] }
      }
    })

    edtr.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) onSave(edtr.getValue())
    })

    edtr.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      const selection = edtr.getSelection()
      if (selection) {
        const text = edtr.getModel()?.getValueInRange(selection) || ''
        edtr.executeEdits('', [{ range: selection, text: `**${text}**` }])
      }
    })

    edtr.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      const selection = edtr.getSelection()
      if (selection) {
        const text = edtr.getModel()?.getValueInRange(selection) || ''
        edtr.executeEdits('', [{ range: selection, text: `*${text}*` }])
      }
    })

    edtr.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      const selection = edtr.getSelection()
      if (selection) {
        const text = edtr.getModel()?.getValueInRange(selection) || ''
        edtr.executeEdits('', [{ range: selection, text: `[${text}](url)` }])
      }
    })

    edtr.focus()
    if (onMount) onMount(edtr, monaco)
  }, [onSave, onMount, allSuggestions])

  const handleChange: OnChange = useCallback((val) => {
    if (onChange && val !== undefined) onChange(val)
  }, [onChange])

  useEffect(() => {
    if (editorRef.current && mounted) {
      const model = editorRef.current.getModel()
      if (model && model.getValue() !== value) {
        editorRef.current.setValue(value || '')
      }
    }
  }, [value, mounted])

  const containerStyle: React.CSSProperties = {
    height: maxHeight,
    minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    background: bgImage ? `url(${bgImage}) center/cover no-repeat` : '#fff',
    transition: 'all 0.3s ease'
  }

  const toolbarStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: immersive ? 0 : 50,
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px',
    background: 'rgba(255,255,255,0.95)',
    borderBottom: '1px solid #e8e8e8',
    zIndex: 10,
    transition: 'all 0.3s ease'
  }

  const editorContainerStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    maxWidth: immersive ? '800px' : '100%',
    margin: immersive ? '0 auto' : '0',
    transition: 'all 0.3s ease'
  }

  const floatingToolbarStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 20,
    right: 20,
    zIndex: 100,
    display: 'flex',
    gap: 8,
    background: 'rgba(0,0,0,0.7)',
    padding: '8px 12px',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
  }

  const settingsPanel = (
    <div style={{ width: 280, padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>字体大小: {editorFontSize}px</div>
        <Slider min={12} max={28} value={editorFontSize} onChange={setEditorFontSize} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>打字机模式</span>
          <Switch checked={typewriter} onChange={setTypewriter} />
        </Space>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>沉浸模式</span>
          <Switch checked={immersive} onChange={setImmersive} />
        </Space>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>背景图片URL:</div>
        <Input 
          placeholder="输入图片URL" 
          value={bgImage} 
          onChange={e => setBgImage(e.target.value)}
          suffix={<PictureOutlined />}
        />
      </div>
      <Button block onClick={() => { setBgImage(''); setEditorFontSize(18); setTypewriter(false); setImmersive(false); message.info('已重置') }}>
        重置设置
      </Button>
    </div>
  )

  const editorOptions: any = {
    fontSize: editorFontSize,
    lineHeight: lineHeight + (typewriter ? 8 : 0),
    wordWrap,
    lineNumbers,
    minimap: { enabled: minimap },
    scrollBeyondLastLine,
    automaticLayout,
    tabSize,
    renderWhitespace: 'selection',
    folding,
    links: true,
    contextmenu: true,
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    readOnly,
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
    padding: { top: immersive ? 60 : 16, bottom: immersive ? 60 : 16 },
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    fontLigatures: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    renderLineHighlight: immersive ? 'none' : 'line',
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    matchBrackets: 'never',
    bracketPairColorization: { enabled: true }
  }

  return (
    <div style={containerStyle}>
      <div style={toolbarStyle}>
        <Space>
          <span style={{ fontWeight: 600 }}>写作</span>
          <span style={{ fontSize: 12, color: '#999' }}>@角色 #章节 ??查询</span>
        </Space>
        <Space>
          <Button type="text" icon={<FullscreenOutlined />} onClick={() => setImmersive(!immersive)} title="沉浸模式" />
          <Button type="text" icon={<SettingOutlined />} onClick={() => setShowSettings(!showSettings)} title="设置" />
        </Space>
      </div>

      <div style={editorContainerStyle}>
        {value === '' && !mounted && (
          <div style={{ position: 'absolute', top: immersive ? 80 : 16, left: 60, color: '#999', pointerEvents: 'none', zIndex: 1 }}>
            {placeholder}
          </div>
        )}
        <Editor
          height="100%"
          language={language}
          value={value || ''}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          theme={theme}
          loading={loading}
          options={editorOptions}
        />
      </div>

      {!immersive && (
        <div style={floatingToolbarStyle}>
          <Button size="small" icon={<FullscreenOutlined />} onClick={() => setImmersive(true)} />
          <Button size="small" icon={<ThunderboltOutlined />} onClick={() => setTypewriter(!typewriter)} type={typewriter ? 'primary' : 'default'} />
          <Popover content={settingsPanel} trigger="click">
            <Button size="small" icon={<SettingOutlined />} />
          </Popover>
        </div>
      )}
    </div>
  )
}

export default RichEditor
