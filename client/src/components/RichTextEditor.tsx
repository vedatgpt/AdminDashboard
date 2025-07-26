import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Bold from '@tiptap/extension-bold'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Açıklama yazınız...", 
  maxLength = 2000 
}: RichTextEditorProps) {
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false, // StarterKit'ten bold'u kapat
      }),
      Bold, // TipTap resmi dökümanına göre ayrı Bold extension
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true
      }),
      Underline,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = editor.getText()
      
      if (text.length <= maxLength) {
        onChange(html)
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none min-h-[200px] p-4',
        style: 'max-width: none;'
      },
    },
  })

  const currentLength = editor?.getText()?.length || 0

  if (!editor) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-gray-200 p-3 bg-gray-50 flex flex-wrap gap-2">
          {/* Text Formatting */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 text-sm font-bold border rounded ${
              editor.isActive('bold') 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            title="Kalın (Ctrl+B)"
          >
            B
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 text-sm italic border rounded ${
              editor.isActive('italic') 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            I
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-3 py-1 text-sm underline border rounded ${
              editor.isActive('underline') 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            U
          </button>

          {/* Separator */}
          <div className="w-px h-8 bg-gray-300"></div>

          {/* Text Alignment */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`px-3 py-1 text-sm border rounded ${
              editor.isActive({ textAlign: 'left' }) 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            ⬅
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`px-3 py-1 text-sm border rounded ${
              editor.isActive({ textAlign: 'center' }) 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            ↔
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`px-3 py-1 text-sm border rounded ${
              editor.isActive({ textAlign: 'right' }) 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            ➡
          </button>

          {/* Separator */}
          <div className="w-px h-8 bg-gray-300"></div>

          {/* Text Color */}
          <input
            type="color"
            onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
            value={editor.getAttributes('textStyle').color || '#000000'}
            data-testid="setColor"
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            title="Metin Rengi"
          />

          {/* Background Color */}
          <input
            type="color"
            onInput={(event) => editor.chain().focus().setHighlight({ color: (event.target as HTMLInputElement).value }).run()}
            value={editor.getAttributes('highlight').color || '#ffffff'}
            data-testid="setHighlight"
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            title="Arkaplan Rengi"
          />

          {/* Remove Color */}
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetColor().run()
              editor.chain().focus().unsetHighlight().run()
            }}
            className="px-3 py-1 text-sm border rounded bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            title="Renkleri Temizle"
          >
            🗑
          </button>

          {/* Separator */}
          <div className="w-px h-8 bg-gray-300"></div>

          {/* Lists */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 text-sm border rounded ${
              editor.isActive('bulletList') 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            • Liste
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1 text-sm border rounded ${
              editor.isActive('orderedList') 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            1. Liste
          </button>
        </div>
        
        {/* Editor */}
        <div className="min-h-[200px] bg-white relative">
          <EditorContent editor={editor} />
          {placeholder && !editor.getText() && (
            <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
              {placeholder}
            </div>
          )}
        </div>
      </div>
      
      {/* Karakter Sayacı */}
      <div className="text-right text-sm text-gray-500">
        {currentLength} / {maxLength}
      </div>
    </div>
  )
}