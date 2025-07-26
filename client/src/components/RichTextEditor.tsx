import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Bold from '@tiptap/extension-bold'
import TextAlign from '@tiptap/extension-text-align'
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
        bold: false, // Duplicate warning'ı önlemek için StarterKit bold'u kapat
      }),
      Bold.configure({
        HTMLAttributes: {
          class: 'font-bold',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true
      }),
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

          {/* Text Alignment - TipTap Resmi İkonlar */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`px-3 py-1 text-sm border rounded ${
              editor.isActive({ textAlign: 'left' }) 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            title="Sola Hizala"
          >
            ⬅️
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`px-3 py-1 text-sm border rounded ${
              editor.isActive({ textAlign: 'center' }) 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            title="Ortala"
          >
            ↔️
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`px-3 py-1 text-sm border rounded ${
              editor.isActive({ textAlign: 'right' }) 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            title="Sağa Hizala"
          >
            ➡️
          </button>

          {/* Separator */}
          <div className="w-px h-8 bg-gray-300"></div>



          {/* Highlight Dropdown - Tek Buton */}
          <div className="relative group">
            <button
              type="button"
              className={`px-3 py-1 text-sm border rounded flex items-center gap-1 ${
                editor.isActive('highlight') 
                  ? 'bg-yellow-300 text-black border-yellow-400' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
              title="Vurgula (Ctrl+Shift+H)"
            >
              🖍️
              <span className="text-xs">▼</span>
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="p-2 space-y-1 min-w-[120px]">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight().run()}
                  className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 flex items-center gap-2"
                >
                  <span className="w-4 h-4 bg-yellow-300 rounded"></span>
                  Sarı
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color: '#ffc078' }).run()}
                  className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 flex items-center gap-2"
                >
                  <span className="w-4 h-4 rounded" style={{ backgroundColor: '#ffc078' }}></span>
                  Turuncu
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color: '#8ce99a' }).run()}
                  className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 flex items-center gap-2"
                >
                  <span className="w-4 h-4 rounded" style={{ backgroundColor: '#8ce99a' }}></span>
                  Yeşil
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color: '#74c0fc' }).run()}
                  className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 flex items-center gap-2"
                >
                  <span className="w-4 h-4 rounded" style={{ backgroundColor: '#74c0fc' }}></span>
                  Mavi
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color: '#b197fc' }).run()}
                  className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 flex items-center gap-2"
                >
                  <span className="w-4 h-4 rounded" style={{ backgroundColor: '#b197fc' }}></span>
                  Mor
                </button>
                {editor.isActive('highlight') && (
                  <>
                    <hr className="my-1 border-gray-200" />
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().unsetHighlight().run()}
                      className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 text-red-600"
                    >
                      Vurguyu Kaldır
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

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