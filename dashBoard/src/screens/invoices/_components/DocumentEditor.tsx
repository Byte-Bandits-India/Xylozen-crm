import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { EditorToolbar } from './EditorToolbar';
import { DocumentTableControls } from './DocumentTableControls';
import { cn } from '@/lib/utils';

interface DocumentEditorProps {
  contentHtml: string;
  onChangeHtml: (html: string) => void;
  className?: string;
  readOnly?: boolean;
}

export const DocumentEditor = ({
  contentHtml,
  onChangeHtml,
  className,
  readOnly = false,
}: DocumentEditorProps) => {
  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-600 underline hover:text-blue-800',
          },
        },
        underline: {},
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
        lastColumnResizable: true,
        handleWidth: 6,
        cellMinWidth: 40,
        allowTableNodeSelection: true,
        HTMLAttributes: {
          class: 'doc-table border-collapse w-full my-4 border border-gray-900',
        },
      }),
      TableRow.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: (el) => el.getAttribute('style'),
              renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
            },
          };
        },
      }),
      TableHeader.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: (el) => el.getAttribute('style'),
              renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
            },
          };
        },
      }).configure({
        HTMLAttributes: {
          class: 'bg-[#dce8fd] border border-gray-900 p-2.5 font-bold text-left text-sm text-gray-900',
        },
      }),
      TableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: (el) => el.getAttribute('style'),
              renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
            },
          };
        },
      }).configure({
        HTMLAttributes: {
          class: 'border border-gray-900 p-2.5 text-sm text-gray-800 align-top',
        },
      }),
    ],
    content: contentHtml,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChangeHtml(html);
    },
  });

  // Keep editor content in sync when contentHtml prop changes externally
  useEffect(() => {
    if (editor && contentHtml !== editor.getHTML()) {
      editor.commands.setContent(contentHtml, { emitUpdate: false });
    }
  }, [contentHtml, editor]);

  return (
    <div className={cn('flex flex-col bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden', className)}>
      {/* Word-Style Toolbar */}
      {!readOnly && <EditorToolbar editor={editor} />}

      {/* Floating Contextual Table Controls */}
      {!readOnly && editor?.isActive('table') && (
        <div className="px-3 pt-2">
          <DocumentTableControls editor={editor} />
        </div>
      )}

      {/* Document Sheet Editing Canvas */}
      <div className="p-6 md:p-8 min-h-[460px] bg-white cursor-text">
        <EditorContent
          editor={editor}
          className={cn(
            'prose prose-slate max-w-none focus:outline-none min-h-[380px]',
            'prose-headings:font-bold prose-headings:text-gray-900',
            'prose-h1:text-xl prose-h1:mb-3 prose-h1:mt-4',
            'prose-h2:text-base prose-h2:font-bold prose-h2:mb-2 prose-h2:mt-4 prose-h2:text-gray-900',
            'prose-h3:text-sm prose-h3:font-semibold prose-h3:mb-1.5 prose-h3:mt-3',
            'prose-p:text-sm prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-3',
            'prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2 prose-ul:text-sm',
            'prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-2 prose-ol:text-sm',
            'prose-li:mb-1',
            // Custom Table Styles in Editor
            '[&_.doc-table]:border-collapse [&_.doc-table]:w-full [&_.doc-table]:my-4 [&_.doc-table]:border [&_.doc-table]:border-gray-900',
            '[&_.doc-table_th]:bg-[#dce8fd] [&_.doc-table_th]:border [&_.doc-table_th]:border-gray-900 [&_.doc-table_th]:p-2.5 [&_.doc-table_th]:font-bold [&_.doc-table_th]:text-gray-900',
            '[&_.doc-table_td]:border [&_.doc-table_td]:border-gray-900 [&_.doc-table_td]:p-2.5 [&_.doc-table_td]:text-gray-800 [&_.doc-table_td]:align-top',
            '[&_.selectedCell]:bg-blue-100/60'
          )}
        />
      </div>

      {/* Editor Status / Word Count Footer */}
      <div className="bg-gray-50 border-t border-gray-100 px-4 py-1.5 flex items-center justify-between text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Word-style Document Editor (Tiptap)
        </span>
        <span className="text-gray-400">Press Tab inside tables to navigate cells</span>
      </div>
    </div>
  );
};
