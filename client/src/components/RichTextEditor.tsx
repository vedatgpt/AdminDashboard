import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Bold from '@tiptap/extension-bold'
import TextAlign from '@tiptap/extension-text-align'
import { Highlight } from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import Heading from '@tiptap/extension-heading'
import { useState, useEffect } from 'react'

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
  
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    highlight: false,
    bulletList: false,
    orderedList: false,
    textAlign: 'left',
    heading1: false,
    heading2: false,
    heading3: false
  })
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false, // Duplicate warning'ı önlemek için StarterKit bold'u kapat
        heading: false, // Heading'i ayrı extension olarak ekliyoruz
        paragraph: {
          HTMLAttributes: {
            style: 'margin: 0; line-height: 1.4;',
          },
        },
      }),
      Bold.configure({
        HTMLAttributes: {
          class: 'font-bold',
        },
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true
      }),
      Underline.configure({
        HTMLAttributes: {
          class: 'underline',
        },
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

  // Update active states when editor content changes
  useEffect(() => {
    if (!editor) return
    
    const updateActiveStates = () => {
      setActiveStates({
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        highlight: editor.isActive('highlight'),
        bulletList: editor.isActive('bulletList'),
        orderedList: editor.isActive('orderedList'),
        heading1: editor.isActive('heading', { level: 1 }),
        heading2: editor.isActive('heading', { level: 2 }),
        heading3: editor.isActive('heading', { level: 3 }),
        textAlign: editor.isActive({ textAlign: 'center' }) ? 'center' : 
                  editor.isActive({ textAlign: 'right' }) ? 'right' : 'left'
      })
    }
    
    editor.on('selectionUpdate', updateActiveStates)
    editor.on('transaction', updateActiveStates)
    
    return () => {
      editor.off('selectionUpdate', updateActiveStates)
      editor.off('transaction', updateActiveStates)
    }
  }, [editor])

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
            onClick={() => {
              editor.chain().focus().toggleBold().run()
              setActiveStates(prev => ({ ...prev, bold: !prev.bold }))
            }}
            className={`w-8 h-8 text-sm font-bold border rounded flex items-center justify-center ${
              activeStates.bold 
                ? 'bg-white text-orange-500 border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            title="Kalın (Ctrl+B)"
          >
            B
          </button>
          
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().toggleItalic().run()
              setActiveStates(prev => ({ ...prev, italic: !prev.italic }))
            }}
            className={`w-8 h-8 text-sm italic border rounded flex items-center justify-center ${
              activeStates.italic 
                ? 'bg-white text-orange-500 border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            I
          </button>

          <button
            type="button"
            onClick={() => {
              editor.chain().focus().toggleUnderline().run()
              setActiveStates(prev => ({ ...prev, underline: !prev.underline }))
            }}
            className={`w-8 h-8 text-sm underline border rounded flex items-center justify-center ${
              activeStates.underline 
                ? 'bg-white text-orange-500 border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            U
          </button>

          {/* Heading Buttons */}
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().toggleHeading({ level: 1 }).run()
              setActiveStates(prev => ({ ...prev, heading1: !prev.heading1 }))
            }}
            className={`w-8 h-8 text-sm font-bold border rounded flex items-center justify-center ${
              activeStates.heading1 
                ? 'bg-white text-orange-500 border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            title="Başlık 1"
          >
            H1
          </button>
          
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().toggleHeading({ level: 2 }).run()
              setActiveStates(prev => ({ ...prev, heading2: !prev.heading2 }))
            }}
            className={`w-8 h-8 text-sm font-bold border rounded flex items-center justify-center ${
              activeStates.heading2 
                ? 'bg-white text-orange-500 border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            title="Başlık 2"
          >
            H2
          </button>
          
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().toggleHeading({ level: 3 }).run()
              setActiveStates(prev => ({ ...prev, heading3: !prev.heading3 }))
            }}
            className={`w-8 h-8 text-sm font-bold border rounded flex items-center justify-center ${
              activeStates.heading3 
                ? 'bg-white text-orange-500 border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            title="Başlık 3"
          >
            H3
          </button>

          {/* Text Alignment - TipTap Resmi İkonlar */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`w-8 h-8 text-sm border rounded flex items-center justify-center ${
              editor.isActive({ textAlign: 'left' }) 
                ? 'bg-white text-orange-500 border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            title="Sola Hizala"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h18v2H3zm0 5h12v2H3zm0 5h18v2H3z" fill="currentColor"/>
            </svg>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`w-8 h-8 text-sm border rounded flex items-center justify-center ${
              editor.isActive({ textAlign: 'center' }) 
                ? 'bg-white text-orange-500 border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            title="Ortala"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h18v2H3zm4 5h10v2H7zm-4 5h18v2H3z" fill="currentColor"/>
            </svg>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`w-8 h-8 text-sm border rounded flex items-center justify-center ${
              editor.isActive({ textAlign: 'right' }) 
                ? 'bg-white text-orange-500 border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            title="Sağa Hizala"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h18v2H3zm6 5h12v2H9zm-6 5h18v2H3z" fill="currentColor"/>
            </svg>
          </button>



          {/* Highlight Dropdown - Dikey Liste */}
          <div className="relative group">
            <button
              type="button"
              className={`w-8 h-8 text-sm border rounded flex items-center justify-center ${
                editor.isActive('highlight') 
                  ? 'bg-white text-orange-500 border-orange-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
              title="Vurgula"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.5 4l-1.16-1.16a3 3 0 0 0-4.24 0L5 10.94a1 1 0 0 0 0 1.41l2.65 2.65a1 1 0 0 0 1.41 0L17.16 6.84a3 3 0 0 0 0-4.24L18.5 4z" fill="currentColor"/>
                <path d="M3.5 17.5l3-3L9 17l-3 3a1 1 0 0 1-1.41 0l-.09-.09a1 1 0 0 1 0-1.41z" fill="currentColor"/>
                <path d="M2 22h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            
            {/* Dikey Dropdown Menu */}
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color: '#fff3cd' }).run()}
                  className="w-6 h-6 rounded hover:scale-110 transition-transform block"
                  style={{ backgroundColor: '#fff3cd' }}
                  title="Pastel Sarı"
                ></button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color: '#ffc078' }).run()}
                  className="w-6 h-6 rounded hover:scale-110 transition-transform block"
                  style={{ backgroundColor: '#ffc078' }}
                  title="Turuncu"
                ></button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color: '#8ce99a' }).run()}
                  className="w-6 h-6 rounded hover:scale-110 transition-transform block"
                  style={{ backgroundColor: '#8ce99a' }}
                  title="Yeşil"
                ></button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color: '#a3d9ff' }).run()}
                  className="w-6 h-6 rounded hover:scale-110 transition-transform block"
                  style={{ backgroundColor: '#a3d9ff' }}
                  title="Açık Mavi"
                ></button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color: '#d4a5ff' }).run()}
                  className="w-6 h-6 rounded hover:scale-110 transition-transform block"
                  style={{ backgroundColor: '#d4a5ff' }}
                  title="Açık Mor"
                ></button>
                {editor.isActive('highlight') && (
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().unsetHighlight().run()}
                    className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 transition-colors flex items-center justify-center"
                    title="Vurguyu Kaldır"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 6l12 12m0-12L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lists - TipTap SVG Icons */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`w-8 h-8 text-sm border rounded flex items-center justify-center ${
              editor.isActive('bulletList') 
                ? 'bg-white text-orange-500 border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            title="Madde İşaretli Liste"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="12" r="2" fill="currentColor"/>
              <path d="M10 12h12M10 6h12M10 18h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`w-8 h-8 text-sm border rounded flex items-center justify-center ${
              editor.isActive('orderedList') 
                ? 'bg-white text-orange-500 border-orange-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            title="Numaralı Liste"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4h2v2H2V4zm0 6h2v2H2v-2zm0 6h2v2H2v-2z" fill="currentColor"/>
              <path d="M6 5h16M6 11h16M6 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        {/* Editor - Resizable with Scroll */}
        <div className="resize-y overflow-hidden min-h-[200px] max-h-[400px] bg-white relative">
          <div className="h-full overflow-y-auto">
            <EditorContent editor={editor} />
            {placeholder && !editor.getText() && (
              <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                {placeholder}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}