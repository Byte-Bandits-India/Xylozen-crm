import React, { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  Table as TableIcon,
  Trash2,
  Combine,
  ChevronDown,
} from 'lucide-react';
import { Dropdown, Popover, InputNumber, Checkbox, Button } from 'antd';
import type { MenuProps } from 'antd';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  editor: Editor | null;
  className?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, className }) => {
  const [tablePopoverOpen, setTablePopoverOpen] = useState(false);
  const [customCols, setCustomCols] = useState(3);
  const [customRows, setCustomRows] = useState(3);
  const [withHeader, setWithHeader] = useState(true);

  if (!editor) return null;

  const handleLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleInsertTable = (rows: number, cols: number, hasHeader: boolean = withHeader) => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: Math.max(1, rows), cols: Math.max(1, cols), withHeaderRow: hasHeader })
      .run();
    setTablePopoverOpen(false);
  };
  const tablePopoverContent = (
    <div className="p-2 w-64 flex flex-col gap-3 select-none">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
          <TableIcon className="h-3.5 w-3.5 text-blue-600" />
          Insert Table
        </span>
        <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {customRows} × {customCols} Table
        </span>
      </div>

      {/* Quick Presets */}
      <div>
        <span className="text-[10.5px] text-gray-500 font-medium block mb-1">
          Quick Dimension Presets:
        </span>
        <div className="flex flex-wrap gap-1">
          {[
            { r: 2, c: 2, label: '2 × 2' },
            { r: 3, c: 3, label: '3 × 3' },
            { r: 4, c: 3, label: '4 × 3' },
            { r: 5, c: 4, label: '5 × 4' },
            { r: 6, c: 2, label: '6 × 2' },
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handleInsertTable(p.r, p.c)}
              className="px-2 py-0.5 text-[11px] font-medium rounded bg-gray-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-gray-200 transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Inputs */}
      <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 flex flex-col gap-2">
        <span className="text-[10.5px] text-gray-600 font-semibold">Custom Table Size:</span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[10px] text-gray-500 font-medium block mb-0.5">Columns:</label>
            <InputNumber
              size="small"
              min={1}
              max={12}
              value={customCols}
              onChange={(v) => setCustomCols(v || 1)}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-medium block mb-0.5">Rows:</label>
            <InputNumber
              size="small"
              min={1}
              max={30}
              value={customRows}
              onChange={(v) => setCustomRows(v || 1)}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-gray-200 mt-1">
          <Checkbox
            checked={withHeader}
            onChange={(e) => setWithHeader(e.target.checked)}
            className="text-[11px] text-gray-700"
          >
            Header Row
          </Checkbox>

          <Button
            type="primary"
            size="small"
            onClick={() => handleInsertTable(customRows, customCols)}
            className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold cursor-pointer"
          >
            Insert Table
          </Button>
        </div>
      </div>

      {/* If cursor is already in a table, provide quick table actions */}
      {editor.isActive('table') && (
        <div className="border-t border-gray-100 pt-2 flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Current Table Actions:
          </span>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().addRowAfter().run();
                setTablePopoverOpen(false);
              }}
              className="px-2 py-1 text-left rounded hover:bg-slate-100 text-gray-700 transition-colors cursor-pointer"
            >
              + Add Row Below
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().addColumnAfter().run();
                setTablePopoverOpen(false);
              }}
              className="px-2 py-1 text-left rounded hover:bg-slate-100 text-gray-700 transition-colors cursor-pointer"
            >
              + Add Column Right
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().deleteRow().run();
                setTablePopoverOpen(false);
              }}
              className="px-2 py-1 text-left rounded hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
            >
              - Delete Row
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().deleteColumn().run();
                setTablePopoverOpen(false);
              }}
              className="px-2 py-1 text-left rounded hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
            >
              - Delete Column
            </button>
            <button
              type="button"
              disabled={!editor.can().mergeOrSplit()}
              onClick={() => {
                editor.chain().focus().mergeOrSplit().run();
                setTablePopoverOpen(false);
              }}
              className="col-span-2 px-2 py-1 text-left rounded hover:bg-indigo-50 text-indigo-600 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-30"
            >
              <Combine className="h-3 w-3" />
              Merge / Split Cells
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().deleteTable().run();
                setTablePopoverOpen(false);
              }}
              className="col-span-2 px-2 py-1 text-left rounded hover:bg-red-50 text-red-600 font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Delete Entire Table
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const headingMenuItems: MenuProps['items'] = [
    {
      key: 'p',
      label: 'Normal Text (Paragraph)',
      onClick: () => editor.chain().focus().setParagraph().run(),
    },
    {
      key: 'h1',
      label: <span className="font-bold text-base">Heading 1</span>,
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      key: 'h2',
      label: <span className="font-semibold text-sm">Heading 2 (Section Title)</span>,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      key: 'h3',
      label: <span className="font-medium text-xs">Heading 3 (Sub-heading)</span>,
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
  ];

  const currentHeadingLabel = editor.isActive('heading', { level: 1 })
    ? 'Heading 1'
    : editor.isActive('heading', { level: 2 })
    ? 'Heading 2'
    : editor.isActive('heading', { level: 3 })
    ? 'Heading 3'
    : 'Normal';

  return (
    <div
      className={cn(
        'sticky top-0 z-20 flex flex-wrap items-center gap-1 bg-white/95 backdrop-blur-xs border-b border-gray-200 px-3 py-2 text-xs select-none shadow-2xs',
        className
      )}
    >
      {/* Undo & Redo */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          title="Undo (Ctrl+Z)"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 text-gray-700 transition-colors"
        >
          <Undo className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Redo (Ctrl+Y)"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 text-gray-700 transition-colors"
        >
          <Redo className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-4 w-px bg-gray-200 mx-1" />

      {/* Heading Selector */}
      <Dropdown menu={{ items: headingMenuItems }} trigger={['click']}>
        <button
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-50 border border-gray-200 hover:bg-gray-100 font-medium text-gray-700 transition-colors"
        >
          <span>{currentHeadingLabel}</span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
      </Dropdown>

      <div className="h-4 w-px bg-gray-200 mx-1" />

      {/* Inline Formatting */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          title="Bold (Ctrl+B)"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors',
            editor.isActive('bold') && 'bg-blue-100 text-blue-700 font-bold'
          )}
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Italic (Ctrl+I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors',
            editor.isActive('italic') && 'bg-blue-100 text-blue-700 font-semibold'
          )}
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Underline (Ctrl+U)"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors',
            editor.isActive('underline') && 'bg-blue-100 text-blue-700 underline font-semibold'
          )}
        >
          <Underline className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors',
            editor.isActive('strike') && 'bg-blue-100 text-blue-700'
          )}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-4 w-px bg-gray-200 mx-1" />

      {/* Text Alignment */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          title="Align Left"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors',
            editor.isActive({ textAlign: 'left' }) && 'bg-blue-100 text-blue-700'
          )}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Align Center"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors',
            editor.isActive({ textAlign: 'center' }) && 'bg-blue-100 text-blue-700'
          )}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Align Right"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors',
            editor.isActive({ textAlign: 'right' }) && 'bg-blue-100 text-blue-700'
          )}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Justify"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors',
            editor.isActive({ textAlign: 'justify' }) && 'bg-blue-100 text-blue-700'
          )}
        >
          <AlignJustify className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-4 w-px bg-gray-200 mx-1" />

      {/* Lists & Quotes */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          title="Bullet List"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors',
            editor.isActive('bulletList') && 'bg-blue-100 text-blue-700 font-bold'
          )}
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Numbered List"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors',
            editor.isActive('orderedList') && 'bg-blue-100 text-blue-700 font-bold'
          )}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors',
            editor.isActive('blockquote') && 'bg-blue-100 text-blue-700'
          )}
        >
          <Quote className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Horizontal Rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-4 w-px bg-gray-200 mx-1" />

      {/* Link */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          title="Insert Link"
          onClick={handleLink}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 text-gray-700 transition-colors',
            editor.isActive('link') && 'bg-blue-100 text-blue-700'
          )}
        >
          {editor.isActive('link') ? (
            <Unlink className="h-3.5 w-3.5" />
          ) : (
            <LinkIcon className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <div className="h-4 w-px bg-gray-200 mx-1" />

      {/* Customizable Table Popover */}
      <Popover
        content={tablePopoverContent}
        trigger="click"
        open={tablePopoverOpen}
        onOpenChange={setTablePopoverOpen}
        placement="bottomRight"
      >
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors cursor-pointer',
            editor.isActive('table') && 'bg-blue-600 !text-white hover:bg-blue-700 border-blue-600'
          )}
        >
          <TableIcon className="h-3.5 w-3.5" />
          <span>Table</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </button>
      </Popover>
    </div>
  );
};
