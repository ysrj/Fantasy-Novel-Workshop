import { useRef, useCallback, useEffect, useState } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

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
  renderWhitespace?: 'none' | 'selection' | 'trailing' | 'all'
  folding?: boolean
  links?: boolean
  contextmenu?: boolean
  quickSuggestions?: boolean
  suggestOnTriggerCharacters?: boolean
  placeholder?: string
  loading?: React.ReactNode
  onSave?: (value: string) => void
  onMount?: (editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => void
}

function RichEditor({
  value,
  onChange,
  language = 'markdown',
  theme = 'vs',
  fontSize = 16,
  lineHeight = 28,
  minHeight = '100%',
  maxHeight = '100%',
  readOnly = false,
  wordWrap = 'on',
  lineNumbers = 'off',
  minimap = false,
  scrollBeyondLastLine = false,
  automaticLayout = true,
  tabSize = 2,
  renderWhitespace = 'selection',
  folding = false,
  links = true,
  contextmenu = true,
  quickSuggestions = false,
  suggestOnTriggerCharacters = false,
  placeholder = '开始写作...',
  loading = <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>编辑器加载中...</div>,
  onSave,
  onMount
}: EditorProps): JSX.Element {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const [mounted, setMounted] = useState(false)

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    setMounted(true)

    // Configure markdown syntax highlighting
    monaco.languages.setLanguageConfiguration('markdown', {
      wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
      comments: {
        blockComment: ['<!--', '-->']
      },
      brackets: [
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: '`', close: '`' },
        { open: '*', close: '*' },
        { open: '_', close: '_' }
      ]
    })

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onSave(editor.getValue())
      }
    })

    // Bold
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      const selection = editor.getSelection()
      if (selection) {
        const text = editor.getModel()?.getValueInRange(selection) || ''
        editor.executeEdits('', [{
          range: selection,
          text: `**${text}**`
        }])
      }
    })

    // Italic
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      const selection = editor.getSelection()
      if (selection) {
        const text = editor.getModel()?.getValueInRange(selection) || ''
        editor.executeEdits('', [{
          range: selection,
          text: `*${text}*`
        }])
      }
    })

    // Link
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      const selection = editor.getSelection()
      if (selection) {
        const text = editor.getModel()?.getValueInRange(selection) || ''
        editor.executeEdits('', [{
          range: selection,
          text: `[${text}](url)`
        }])
      }
    })

    // Focus editor
    editor.focus()

    if (onMount) {
      onMount(editor, monaco)
    }
  }, [onSave, onMount])

  const handleChange: OnChange = useCallback((value) => {
    if (onChange && value !== undefined) {
      onChange(value)
    }
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
    flexDirection: 'column'
  }

  const editorContainerStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0
  }

  return (
    <div style={containerStyle}>
      {value === '' && !mounted && (
        <div style={{
          position: 'absolute',
          top: 8,
          left: 60,
          color: '#999',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {placeholder}
        </div>
      )}
      <div style={editorContainerStyle}>
        <Editor
          height="100%"
          language={language}
          value={value || ''}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          theme={theme}
          loading={loading}
          options={{
            fontSize,
            lineHeight,
            wordWrap,
            lineNumbers,
            minimap: { enabled: minimap },
            scrollBeyondLastLine,
            automaticLayout,
            tabSize,
            renderWhitespace,
            folding,
            links,
            contextmenu,
            quickSuggestions,
            suggestOnTriggerCharacters,
            readOnly,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8
            },
            padding: { top: 16, bottom: 16 },
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontLigatures: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            renderLineHighlight: 'none',
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            overviewRulerLanes: 0,
            matchBrackets: 'never',
            bracketPairColorization: { enabled: true },
            guides: {
              indentation: false,
              bracketPairs: false
            }
          }}
        />
      </div>
    </div>
  )
}

export default RichEditor
