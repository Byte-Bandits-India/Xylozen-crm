import * as React from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Minus,
  Undo,
  Redo,
  RemoveFormatting,
  Eye,
  Code2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type RichTextEditorProps = {
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
  readOnly?: boolean
  disabled?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Provide scope of work, technical requirements, acceptance criteria...',
  className,
  minHeight = '140px',
  readOnly = false,
  disabled = false,
}: RichTextEditorProps) {
  const isReadOnly = readOnly || disabled
  const editorRef = React.useRef<HTMLDivElement>(null)
  const isUpdatingRef = React.useRef(false)
  const [activeFormats, setActiveFormats] = React.useState<Record<string, boolean>>({})
  const [isSourceMode, setIsSourceMode] = React.useState(false)

  // Sync incoming value to contentEditable when not currently editing
  React.useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || ''
      }
    }
  }, [value])

  const checkFormats = () => {
    if (typeof document === 'undefined' || isReadOnly) return
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    })
  }

  const exec = (command: string, val: string | undefined = undefined) => {
    if (isReadOnly || isSourceMode) return
    editorRef.current?.focus()
    document.execCommand(command, false, val)
    checkFormats()
    handleInput()
  }

  const handleInput = () => {
    if (isReadOnly || !editorRef.current) return
    isUpdatingRef.current = true
    const html = editorRef.current.innerHTML
    // Clean empty paragraphs or single <br>
    const cleanHtml = html === '<br>' || html === '<p><br></p>' ? '' : html
    onChange?.(cleanHtml)
    isUpdatingRef.current = false
  }

  const handleInsertLink = () => {
    if (isReadOnly) return
    const url = window.prompt('Enter link URL (e.g. https://...):')
    if (url) {
      exec('createLink', url)
    }
  }

  const handleFormatBlock = (tag: string) => {
    if (isReadOnly) return
    exec('formatBlock', `<${tag}>`)
  }

  // Calculate text stats
  const plainText = React.useMemo(() => {
    if (!value) return ''
    return value.replace(/<[^>]*>?/gm, '').trim()
  }, [value])

  const wordCount = React.useMemo(() => {
    if (!plainText) return 0
    return plainText.split(/\s+/).filter(Boolean).length
  }, [plainText])

  return (
    <div
      className={cn(
        'border-input bg-card rounded-lg border transition-all shadow-2xs overflow-hidden',
        !isReadOnly && 'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[2px]',
        isReadOnly && 'bg-muted/10 opacity-90',
        className
      )}
    >
      {/* Rich Text Toolbar */}
      {!isReadOnly && (
        <div className="bg-muted/40 border-b border-border/60 p-1.5 flex flex-wrap items-center justify-between gap-1 text-xs select-none">
        <div className="flex flex-wrap items-center gap-0.5">
          {/* Headings */}
          <button
            type="button"
            title="Heading 1"
            disabled={isSourceMode}
            onClick={() => handleFormatBlock('h1')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded p-1.5 transition-colors disabled:opacity-40"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Heading 2"
            disabled={isSourceMode}
            onClick={() => handleFormatBlock('h2')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded p-1.5 transition-colors disabled:opacity-40"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Heading 3"
            disabled={isSourceMode}
            onClick={() => handleFormatBlock('h3')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded p-1.5 transition-colors disabled:opacity-40"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </button>

          <div className="bg-border h-4 w-px mx-1" />

          {/* Inline styles */}
          <button
            type="button"
            title="Bold (Ctrl+B)"
            disabled={isSourceMode}
            onClick={() => exec('bold')}
            className={cn(
              'hover:bg-muted/80 rounded p-1.5 transition-colors disabled:opacity-40',
              activeFormats.bold
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Italic (Ctrl+I)"
            disabled={isSourceMode}
            onClick={() => exec('italic')}
            className={cn(
              'hover:bg-muted/80 rounded p-1.5 transition-colors disabled:opacity-40',
              activeFormats.italic
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Underline (Ctrl+U)"
            disabled={isSourceMode}
            onClick={() => exec('underline')}
            className={cn(
              'hover:bg-muted/80 rounded p-1.5 transition-colors disabled:opacity-40',
              activeFormats.underline
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Underline className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Strikethrough"
            disabled={isSourceMode}
            onClick={() => exec('strikeThrough')}
            className={cn(
              'hover:bg-muted/80 rounded p-1.5 transition-colors disabled:opacity-40',
              activeFormats.strikeThrough
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Code Block"
            disabled={isSourceMode}
            onClick={() => handleFormatBlock('pre')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded p-1.5 transition-colors disabled:opacity-40"
          >
            <Code className="h-3.5 w-3.5" />
          </button>

          <div className="bg-border h-4 w-px mx-1" />

          {/* Lists & Quotes */}
          <button
            type="button"
            title="Bullet List"
            disabled={isSourceMode}
            onClick={() => exec('insertUnorderedList')}
            className={cn(
              'hover:bg-muted/80 rounded p-1.5 transition-colors disabled:opacity-40',
              activeFormats.insertUnorderedList
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Numbered List"
            disabled={isSourceMode}
            onClick={() => exec('insertOrderedList')}
            className={cn(
              'hover:bg-muted/80 rounded p-1.5 transition-colors disabled:opacity-40',
              activeFormats.insertOrderedList
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Blockquote"
            disabled={isSourceMode}
            onClick={() => handleFormatBlock('blockquote')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded p-1.5 transition-colors disabled:opacity-40"
          >
            <Quote className="h-3.5 w-3.5" />
          </button>

          <div className="bg-border h-4 w-px mx-1" />

          {/* Special Elements */}
          <button
            type="button"
            title="Insert Link"
            disabled={isSourceMode}
            onClick={handleInsertLink}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded p-1.5 transition-colors disabled:opacity-40"
          >
            <Link className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Horizontal Divider"
            disabled={isSourceMode}
            onClick={() => exec('insertHorizontalRule')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded p-1.5 transition-colors disabled:opacity-40"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Clear Formatting"
            disabled={isSourceMode}
            onClick={() => exec('removeFormat')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded p-1.5 transition-colors disabled:opacity-40"
          >
            <RemoveFormatting className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right Action Tools: Undo, Redo, Mode Switch */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            disabled={isSourceMode}
            onClick={() => exec('undo')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded p-1.5 transition-colors disabled:opacity-40"
          >
            <Undo className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Y)"
            disabled={isSourceMode}
            onClick={() => exec('redo')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded p-1.5 transition-colors disabled:opacity-40"
          >
            <Redo className="h-3.5 w-3.5" />
          </button>
          <div className="bg-border h-4 w-px mx-1" />
          <button
            type="button"
            title={isSourceMode ? 'Switch to Visual Mode' : 'Switch to Raw HTML Mode'}
            onClick={() => setIsSourceMode((prev) => !prev)}
            className={cn(
              'rounded px-2 py-1 flex items-center gap-1 text-[11px] font-medium transition-colors',
              isSourceMode
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            )}
          >
            {isSourceMode ? (
              <>
                <Eye className="h-3 w-3" /> Visual
              </>
            ) : (
              <>
                <Code2 className="h-3 w-3" /> HTML
              </>
            )}
          </button>
        </div>
      </div>
      )}

      {/* Editor Content Body */}
      {!isReadOnly && isSourceMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          style={{ minHeight }}
          className="w-full p-3.5 font-mono text-xs text-foreground bg-background outline-none resize-y"
        />
      ) : (
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable={!isReadOnly}
            onInput={isReadOnly ? undefined : handleInput}
            onKeyUp={isReadOnly ? undefined : checkFormats}
            onMouseUp={isReadOnly ? undefined : checkFormats}
            style={{ minHeight }}
            data-placeholder={placeholder}
            className={cn(
              'w-full p-3.5 text-sm text-foreground bg-background outline-none overflow-y-auto',
              isReadOnly ? 'cursor-default select-text' : '',
              'prose prose-sm dark:prose-invert max-w-none',
              // Rich content styles
              '[&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-1',
              '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-1.5 [&_h2]:mt-1',
              '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1',
              '[&_p]:mb-2 [&_p]:leading-relaxed',
              '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2',
              '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2',
              '[&_li]:mb-0.5',
              '[&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2 [&_blockquote]:text-muted-foreground',
              '[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono',
              '[&_a]:text-primary [&_a]:underline',
              '[&_hr]:my-3 [&_hr]:border-border',
              // Placeholder when empty
              'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none empty:before:text-sm'
            )}
          />
        </div>
      )}

      {/* Bottom Bar: Stats */}
      <div className="bg-muted/20 border-t border-border/40 px-3 py-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              'inline-block h-1.5 w-1.5 rounded-full',
              isReadOnly ? 'bg-muted-foreground/50' : 'bg-emerald-500'
            )}
          />
          {isReadOnly ? 'Read-only' : 'Rich Text Editor'}
        </span>
        <span>
          {wordCount} {wordCount === 1 ? 'word' : 'words'} · {plainText.length} chars
        </span>
      </div>
    </div>
  )
}
