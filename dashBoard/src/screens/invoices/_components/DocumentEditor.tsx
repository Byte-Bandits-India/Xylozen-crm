import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { FileText, Plus, ChevronLeft, ChevronRight, Copy, Trash2 } from 'lucide-react';
import { Tooltip, Popconfirm } from 'antd';
import { EditorToolbar } from './EditorToolbar';
import { DocumentTableControls } from './DocumentTableControls';
import { cn } from '@/lib/utils';

interface DocumentEditorProps {
  contentHtml?: string;
  onChangeHtml?: (html: string) => void;
  // Multi-page props
  pages?: string[];
  activePageIndex?: number;
  onPageChange?: (index: number, newHtml: string) => void;
  onSelectPage?: (index: number) => void;
  onAddPage?: () => void;
  onDeletePage?: (index: number) => void;
  onDuplicatePage?: (index: number) => void;
  onMovePage?: (fromIndex: number, toIndex: number) => void;
  className?: string;
  readOnly?: boolean;
}

export const DocumentEditor = ({
  contentHtml = '',
  onChangeHtml,
  pages,
  activePageIndex = 0,
  onPageChange,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onDuplicatePage,
  onMovePage,
  className,
  readOnly = false,
}: DocumentEditorProps) => {
  const currentActiveIndex = activePageIndex ?? 0;
  const activeContent = pages ? (pages[currentActiveIndex] ?? '') : contentHtml;

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
    content: activeContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onPageChange && pages) {
        onPageChange(currentActiveIndex, html);
      }
      if (onChangeHtml) {
        onChangeHtml(html);
      }
    },
  });

  // Keep editor content in sync when active content changes externally or tab switches
  useEffect(() => {
    if (editor && activeContent !== editor.getHTML()) {
      editor.commands.setContent(activeContent, { emitUpdate: false });
    }
  }, [activeContent, editor]);

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

      {/* Multi-Page Navigation Bar */}
      {pages && pages.length > 0 && !readOnly && (
        <div className="bg-slate-50/90 border-b border-gray-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 select-none">
          {/* Left: Page Tabs & Add Button */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            {pages.map((_, idx) => {
              const isActive = idx === currentActiveIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectPage?.(idx)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap',
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/80'
                  )}
                >
                  <FileText className={cn('h-3.5 w-3.5', isActive ? 'text-white' : 'text-blue-600')} />
                  <span>Page {idx + 1}</span>
                </button>
              );
            })}

            {onAddPage && (
              <button
                type="button"
                onClick={onAddPage}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium text-blue-600 bg-blue-50/80 hover:bg-blue-100 border border-dashed border-blue-300 transition-all cursor-pointer whitespace-nowrap"
                title="Add a new page to this document"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Page</span>
              </button>
            )}
          </div>

          {/* Right: Active Page Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] font-semibold text-gray-500 mr-1.5">
              Page {currentActiveIndex + 1} of {pages.length}
            </span>

            {onMovePage && pages.length > 1 && (
              <>
                <Tooltip title="Move page earlier">
                  <button
                    type="button"
                    disabled={currentActiveIndex === 0}
                    onClick={() => onMovePage(currentActiveIndex, currentActiveIndex - 1)}
                    className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-200/70 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                </Tooltip>

                <Tooltip title="Move page later">
                  <button
                    type="button"
                    disabled={currentActiveIndex === pages.length - 1}
                    onClick={() => onMovePage(currentActiveIndex, currentActiveIndex + 1)}
                    className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-200/70 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </Tooltip>
              </>
            )}

            {onDuplicatePage && (
              <Tooltip title="Duplicate this page">
                <button
                  type="button"
                  onClick={() => onDuplicatePage(currentActiveIndex)}
                  className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-200/70 transition-colors cursor-pointer ml-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            )}

            {onDeletePage && pages.length > 1 && (
              <Popconfirm
                title="Delete this page?"
                description={`Are you sure you want to delete Page ${currentActiveIndex + 1}? Its content will be lost.`}
                onConfirm={() => onDeletePage(currentActiveIndex)}
                okText="Yes, Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true, size: 'small' }}
                cancelButtonProps={{ size: 'small' }}
              >
                <Tooltip title="Delete this page">
                  <button
                    type="button"
                    className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Tooltip>
              </Popconfirm>
            )}
          </div>
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
            '[&_.selectedCell]:bg-blue-100/60',
            // Visual Page Break divider in Editor
            '[&_.page-break]:my-8 [&_.page-break]:border-t-2 [&_.page-break]:border-dashed [&_.page-break]:border-blue-400 [&_.page-break]:relative [&_.page-break]:overflow-visible [&_.page-break]:before:content-["---_Page_Break_---"] [&_.page-break]:before:absolute [&_.page-break]:before:left-1/2 [&_.page-break]:before:-top-3 [&_.page-break]:before:-translate-x-1/2 [&_.page-break]:before:bg-blue-50 [&_.page-break]:before:text-blue-600 [&_.page-break]:before:px-2 [&_.page-break]:before:py-0.5 [&_.page-break]:before:text-[10px] [&_.page-break]:before:font-bold [&_.page-break]:before:rounded-md [&_.page-break]:before:border [&_.page-break]:before:border-blue-200'
          )}
        />
      </div>

      {/* Editor Status / Word Count Footer */}
      <div className="bg-gray-50 border-t border-gray-100 px-4 py-1.5 flex items-center justify-between text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Word-style Document Editor (Tiptap)
          {pages && pages.length > 1 && (
            <span className="text-gray-500 font-medium">
              • Page {currentActiveIndex + 1} of {pages.length}
            </span>
          )}
        </span>
        <span className="text-gray-400">Press Tab inside tables to navigate cells</span>
      </div>
    </div>
  );
};
