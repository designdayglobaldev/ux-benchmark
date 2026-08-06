import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Code, Undo, Redo, Minus, Highlighter } from 'lucide-react'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'


interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm max-w-none dark:prose-invert',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  // Sync external value changes (e.g. from async form reset on edit screens)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  const toggleClass = (isActive: boolean) => 
    `inline-flex items-center justify-center rounded-sm text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 px-2.5 ${isActive ? "bg-muted text-foreground" : "text-muted-foreground bg-transparent"}`

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-wrap items-center gap-1 p-1 border rounded-md bg-transparent">
        <button
          type="button"
          className={toggleClass(editor.isActive('heading', { level: 1 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria-label="Toggle heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toggleClass(editor.isActive('heading', { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="Toggle heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toggleClass(editor.isActive('heading', { level: 3 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          aria-label="Toggle heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          type="button"
          className={toggleClass(editor.isActive('bold'))}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Toggle bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toggleClass(editor.isActive('italic'))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Toggle italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toggleClass(editor.isActive('strike'))}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Toggle strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toggleClass(editor.isActive('code'))}
          onClick={() => editor.chain().focus().toggleCode().run()}
          aria-label="Toggle code"
        >
          <Code className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          type="button"
          className={toggleClass(editor.isActive('bulletList'))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Toggle bullet list"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toggleClass(editor.isActive('orderedList'))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Toggle ordered list"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          type="button"
          className={toggleClass(editor.isActive('blockquote'))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="Toggle quote"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toggleClass(false)}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          aria-label="Insert horizontal rule"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button
          type="button"
          className={toggleClass(editor.isActive('highlight'))}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          aria-label="Toggle highlight"
        >
          <Highlighter className="h-4 w-4" />
        </button>
        <div className="flex items-center justify-center px-1">
          <input
            type="color"
            onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
            value={editor.getAttributes('textStyle').color || '#000000'}
            className="w-5 h-5 border-0 rounded cursor-pointer p-0 bg-transparent"
            title="Text color"
          />
        </div>
        <div className="flex-grow" />
        <div className="w-px h-6 bg-border mx-1" />
        <button
          type="button"
          className={toggleClass(false)}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label="Undo"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toggleClass(false)}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label="Redo"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
