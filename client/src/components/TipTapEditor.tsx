import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import ImageResize from 'tiptap-extension-resize-image';
import '../styles/tiptap.css';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  maxLength?: number;
  placeholder?: string;
}

export default function TipTapEditor({ content, onChange, maxLength = 2000, placeholder }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        bold: {
          HTMLAttributes: {
            class: 'font-bold',
          },
        },
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
      ImageResize.configure({
        HTMLAttributes: {
          style: 'margin: 8px 0; border-radius: 4px;',
        },
        allowBase64: true,
        inline: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left'
      }),
      TextStyle.configure({
        HTMLAttributes: {
          class: 'tiptap-textstyle',
        },
      }),
      Color.configure({
        types: ['textStyle'],
        keepMarks: true,
        HTMLAttributes: {
          class: 'tiptap-color',
        },
      }),
      Underline.configure({
        HTMLAttributes: {
          class: 'underline',
        },
      }),
    ],
    content: content || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const textContent = editor.getText();
      
      // Karakter sınırlaması kontrolü
      if (textContent.length <= maxLength) {
        onChange(html);
      } else {
        // Sınır aşıldığında geri al
        const currentContent = editor.getHTML();
        setTimeout(() => {
          if (editor && currentContent !== content) {
            editor.commands.setContent(content || '<p></p>');
          }
        }, 100);
      }
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] max-h-[300px] overflow-y-auto p-4 prose prose-sm max-w-none',
        placeholder: placeholder || 'Ürününüzün detaylı açıklamasını yazınız...',
      },
    },
  });

  // Content değiştiğinde editor'ı güncelle
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '<p></p>');
    }
  }, [content, editor]);

  const insertImage = () => {
    const url = window.prompt('Resim URL\'sini girin:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const toggleLink = () => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('Link URL\'sini girin:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* TipTap Toolbar */}
      <div className="border-b border-gray-200 p-3 bg-gray-50 flex flex-wrap gap-1">
        {/* Bold Button */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`w-8 h-8 rounded border text-lg font-bold flex items-center justify-center ${
            editor.isActive('bold') 
              ? 'bg-[#EC7830] text-white border-[#EC7830]' 
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
          title="Bold"
        >
          B
        </button>

        {/* Underline Button */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`w-8 h-8 rounded border text-lg font-medium flex items-center justify-center underline ${
            editor.isActive('underline') 
              ? 'bg-[#EC7830] text-white border-[#EC7830]' 
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
          title="Underline"
        >
          U
        </button>

        {/* Text Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`w-8 h-8 rounded border flex items-center justify-center ${
            editor.isActive({ textAlign: 'left' }) 
              ? 'bg-[#EC7830] text-white border-[#EC7830]' 
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
          title="Align Left"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 8a1 1 0 011-1h9a1 1 0 110 2H3a1 1 0 01-1-1zM2 12a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 16a1 1 0 011-1h6a1 1 0 110 2H3a1 1 0 01-1-1z"/>
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`w-8 h-8 rounded border flex items-center justify-center ${
            editor.isActive({ textAlign: 'center' }) 
              ? 'bg-[#EC7830] text-white border-[#EC7830]' 
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
          title="Align Center"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM5 8a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zM2 12a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM7 16a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"/>
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`w-8 h-8 rounded border flex items-center justify-center ${
            editor.isActive({ textAlign: 'right' }) 
              ? 'bg-[#EC7830] text-white border-[#EC7830]' 
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
          title="Align Right"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM8 8a1 1 0 011-1h8a1 1 0 110 2H9a1 1 0 01-1-1zM2 12a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM11 16a1 1 0 011-1h5a1 1 0 110 2h-5a1 1 0 01-1-1z"/>
          </svg>
        </button>

        {/* Color Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              const dropdown = document.getElementById('color-dropdown');
              dropdown?.classList.toggle('hidden');
            }}
            className="w-8 h-8 rounded border border-gray-200 hover:border-gray-300 flex items-center justify-center transition-colors"
            style={{
              backgroundColor: editor.getAttributes('textStyle')?.color || '#000000'
            }}
            title="Text Color"
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
                { color: '#000000', name: 'Black', bg: 'bg-black' },
                { color: '#DC2626', name: 'Red', bg: 'bg-red-600' },
                { color: '#EC7830', name: 'Orange', bg: 'bg-[#EC7830]' },
                { color: '#2563EB', name: 'Blue', bg: 'bg-blue-600' },
                { color: '#16A34A', name: 'Green', bg: 'bg-green-600' },
                { color: '#9333EA', name: 'Purple', bg: 'bg-purple-600' },
                { color: '#7C2D12', name: 'Brown', bg: 'bg-amber-800' },
                { color: '#BE185D', name: 'Pink', bg: 'bg-pink-600' },
                { color: '#0F766E', name: 'Teal', bg: 'bg-teal-600' }
              ].map(({ color, name, bg }) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().setColor(color).run();
                    document.getElementById('color-dropdown')?.classList.add('hidden');
                  }}
                  className={`w-8 h-8 rounded border border-gray-200 ${bg} hover:scale-110 transition-transform`}
                  title={name}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().unsetColor().run();
                document.getElementById('color-dropdown')?.classList.add('hidden');
              }}
              className="w-full mt-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border text-gray-700 flex items-center justify-center gap-1"
            >
              <span>×</span>
              <span>Rengi Temizle</span>
            </button>
          </div>
        </div>

        {/* Link Toggle */}
        <button
          type="button"
          onClick={toggleLink}
          className={`w-8 h-8 rounded border flex items-center justify-center ${
            editor.isActive('link') 
              ? 'bg-[#EC7830] text-white border-[#EC7830]' 
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
          title="Link"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"/>
          </svg>
        </button>

        {/* Image Insert */}
        <button
          type="button"
          onClick={insertImage}
          className="w-8 h-8 rounded border bg-white text-gray-700 border-gray-200 hover:bg-gray-100 flex items-center justify-center"
          title="Insert Image"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
          </svg>
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
      
      {/* Character Count */}
      <div className="border-t border-gray-200 px-3 py-2 bg-gray-50 text-xs text-gray-500 text-right">
        {editor.storage.characterCount?.characters() || 0} / {maxLength} karakter
      </div>
    </div>
  );
}