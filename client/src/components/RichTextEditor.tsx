import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Underline } from '@tiptap/extension-underline';
import '../styles/tiptap.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Açıklama yazınız...", 
  maxLength = 2000,
  className = ""
}: RichTextEditorProps) {
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        paragraph: {
          HTMLAttributes: {
            style: 'margin: 0; line-height: 1.4;',
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#EC7830] underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left'
      }),
      TextStyle,
      Color,
      Underline.configure({
        HTMLAttributes: {
          class: 'underline',
        },
      }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const textContent = editor.getText();
      
      // Karakter sınırlaması kontrolü
      if (textContent.length <= maxLength) {
        onChange(html);
      } else {
        // Sınır aşıldığında geri al
        setTimeout(() => {
          if (editor && editor.getHTML() !== value) {
            editor.commands.setContent(value || '<p></p>');
          }
        }, 100);
      }
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] max-h-[300px] overflow-y-auto p-4 prose prose-sm max-w-none',
      },
    },
  });

  // value prop değiştiğinde editörü güncelle
  React.useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value || '<p></p>');
    }
  }, [value, editor]);

  const currentLength = editor?.getText()?.length || 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-gray-200 p-3 bg-gray-50 flex flex-wrap gap-1">
          {/* Bold Button */}
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`w-8 h-8 rounded border text-lg font-bold flex items-center justify-center ${
              editor?.isActive('bold') 
                ? 'bg-[#EC7830] text-white border-[#EC7830]' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            title="Kalın"
          >
            B
          </button>

          {/* Italic Button */}
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`w-8 h-8 rounded border text-lg italic flex items-center justify-center ${
              editor?.isActive('italic') 
                ? 'bg-[#EC7830] text-white border-[#EC7830]' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            title="İtalik"
          >
            I
          </button>

          {/* Underline Button */}
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`w-8 h-8 rounded border text-lg underline flex items-center justify-center ${
              editor?.isActive('underline') 
                ? 'bg-[#EC7830] text-white border-[#EC7830]' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            title="Altı Çizili"
          >
            U
          </button>

          {/* Separator */}
          <div className="w-px h-8 bg-gray-300 mx-1"></div>

          {/* Text Alignment Buttons */}
          <button
            type="button"
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            className={`w-8 h-8 rounded border flex items-center justify-center ${
              editor?.isActive({ textAlign: 'left' }) 
                ? 'bg-[#EC7830] text-white border-[#EC7830]' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            title="Sola Hizala"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 8a1 1 0 011-1h9a1 1 0 110 2H3a1 1 0 01-1-1zM2 12a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 16a1 1 0 011-1h6a1 1 0 110 2H3a1 1 0 01-1-1z"/>
            </svg>
          </button>
          
          <button
            type="button"
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            className={`w-8 h-8 rounded border flex items-center justify-center ${
              editor?.isActive({ textAlign: 'center' }) 
                ? 'bg-[#EC7830] text-white border-[#EC7830]' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            title="Ortala"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM5 8a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zM2 12a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM7 16a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"/>
            </svg>
          </button>
          
          <button
            type="button"
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            className={`w-8 h-8 rounded border flex items-center justify-center ${
              editor?.isActive({ textAlign: 'right' }) 
                ? 'bg-[#EC7830] text-white border-[#EC7830]' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            title="Sağa Hizala"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM8 8a1 1 0 011-1h8a1 1 0 110 2H9a1 1 0 01-1-1zM2 12a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM11 16a1 1 0 011-1h5a1 1 0 110 2h-5a1 1 0 01-1-1z"/>
            </svg>
          </button>

          {/* Separator */}
          <div className="w-px h-8 bg-gray-300 mx-1"></div>

          {/* Color Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                const dropdown = document.getElementById('color-dropdown');
                dropdown?.classList.toggle('hidden');
              }}
              className="w-8 h-8 rounded border border-gray-200 hover:border-gray-300 flex items-center justify-center transition-colors"
              style={{
                backgroundColor: editor?.getAttributes('textStyle')?.color || '#000000'
              }}
              title="Metin Rengi"
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
              </svg>
            </button>
            <div
              id="color-dropdown"
              className="absolute top-10 left-0 bg-white border border-gray-200 rounded-lg p-3 shadow-lg hidden z-10 min-w-[150px]"
            >
              <div className="grid grid-cols-3 gap-2">
                {[
                  { color: '#000000', title: 'Siyah', className: 'bg-black' },
                  { color: '#EF4444', title: 'Kırmızı', className: 'bg-red-500' },
                  { color: '#EC7830', title: 'Turuncu', className: 'bg-[#EC7830]' },
                  { color: '#F59E0B', title: 'Sarı', className: 'bg-yellow-500' },
                  { color: '#2563EB', title: 'Mavi', className: 'bg-blue-600' },
                  { color: '#16A34A', title: 'Yeşil', className: 'bg-green-600' },
                  { color: '#9333EA', title: 'Mor', className: 'bg-purple-600' },
                  { color: '#7C2D12', title: 'Kahverengi', className: 'bg-amber-800' },
                  { color: '#BE185D', title: 'Pembe', className: 'bg-pink-600' },
                ].map(({ color, title, className }) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor?.chain().focus().setColor(color).run();
                      document.getElementById('color-dropdown')?.classList.add('hidden');
                    }}
                    className={`w-8 h-8 rounded border border-gray-200 ${className} hover:scale-110 transition-transform`}
                    title={title}
                  />
                ))}
              </div>
              <div className="mt-3 border-t pt-2">
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().unsetColor().run();
                    document.getElementById('color-dropdown')?.classList.add('hidden');
                  }}
                  className="w-full px-3 py-2 text-sm bg-gray-200 text-gray-600 rounded hover:bg-gray-300 flex items-center justify-center"
                  title="Rengi Temizle"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15.293 3.293a1 1 0 011.414 1.414L12.414 9l4.293 4.293a1 1 0 01-1.414 1.414L11 10.414l-4.293 4.293a1 1 0 01-1.414-1.414L9.586 9 5.293 4.707a1 1 0 011.414-1.414L11 7.586l4.293-4.293z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Link Button */}
          <button
            type="button"
            onClick={() => {
              if (editor?.isActive('link')) {
                editor?.chain().focus().unsetLink().run();
              } else {
                const url = window.prompt('Link URL giriniz:');
                if (url) {
                  editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                }
              }
            }}
            className={`w-8 h-8 rounded border flex items-center justify-center ${
              editor?.isActive('link') 
                ? 'bg-[#EC7830] text-white border-[#EC7830]' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            title={editor?.isActive('link') ? 'Linki Kaldır' : 'Link Ekle'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z"/>
              <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z"/>
            </svg>
          </button>

          {/* Lists */}
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`w-8 h-8 rounded border flex items-center justify-center ${
              editor?.isActive('bulletList') 
                ? 'bg-[#EC7830] text-white border-[#EC7830]' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            title="Madde İşaretli Liste"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a1 1 0 100 2 1 1 0 000-2zM3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 11a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM4 14a1 1 0 100 2 1 1 0 000-2zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
            </svg>
          </button>

          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`w-8 h-8 rounded border flex items-center justify-center ${
              editor?.isActive('orderedList') 
                ? 'bg-[#EC7830] text-white border-[#EC7830]' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            title="Numaralı Liste"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM1 3.5A1.5 1.5 0 012.5 2 1.5 1.5 0 014 3.5v.5a.5.5 0 01-1 0v-.5A.5.5 0 002.5 3 .5.5 0 002 3.5v.5a.5.5 0 01-1 0v-.5zM1 7.5A1.5 1.5 0 012.5 6 1.5 1.5 0 014 7.5v.5a.5.5 0 01-1 0v-.5A.5.5 0 002.5 7 .5.5 0 002 7.5v.5a.5.5 0 01-1 0v-.5z"/>
            </svg>
          </button>
        </div>
        
        {/* Editor Content */}
        <div className="min-h-[200px] bg-white relative">
          <EditorContent editor={editor} />
          {placeholder && !editor?.getText() && (
            <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
              {placeholder}
            </div>
          )}
        </div>
      </div>
      
      {/* Character Counter */}
      <div className="flex justify-between text-sm text-gray-500">
        <span></span>
        <span>
          {currentLength} / {maxLength}
        </span>
      </div>
    </div>
  );
}