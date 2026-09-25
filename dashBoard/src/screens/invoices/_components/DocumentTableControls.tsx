import type { Editor } from '@tiptap/react';
import { TableMap, selectedRect } from '@tiptap/pm/tables';
import {
  Plus,
  Trash2,
  Combine,
  ArrowLeftRight,
  ArrowUpDown,
  StretchHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentTableControlsProps {
  editor: Editor | null;
  className?: string;
}

export const DocumentTableControls = ({
  editor,
  className,
}: DocumentTableControlsProps) => {
  if (!editor || !editor.isActive('table')) {
    return null;
  }

  // Adjust column width (+/- delta in px)
  const adjustColumnWidth = (delta: number) => {
    if (!editor) return;
    const { state, dispatch } = editor.view;
    try {
      const rect = selectedRect(state);
      const map = TableMap.get(rect.table);
      const colIndex = rect.left;
      let tr = state.tr;

      // Determine existing column width from first cell in column or default to 150
      let currentWidth = 150;
      const firstCellPos = rect.tableStart + map.map[colIndex];
      const firstCell = tr.doc.nodeAt(firstCellPos);
      if (
        firstCell?.attrs?.colwidth &&
        Array.isArray(firstCell.attrs.colwidth) &&
        firstCell.attrs.colwidth[0]
      ) {
        currentWidth = firstCell.attrs.colwidth[0];
      }
      const newWidth = Math.max(50, Math.min(800, currentWidth + delta));

      // Apply to all cells in this column
      for (let row = 0; row < map.height; row++) {
        const cellPos = rect.tableStart + map.map[row * map.width + colIndex];
        const cell = tr.doc.nodeAt(cellPos);
        if (cell) {
          tr = tr.setNodeMarkup(cellPos, null, {
            ...cell.attrs,
            colwidth: [newWidth],
          });
        }
      }
      dispatch(tr);
    } catch (err) {
      console.warn('Could not adjust column width:', err);
    }
  };

  // Reset / Distribute all columns evenly across 100%
  const distributeColumnsEvenly = () => {
    if (!editor) return;
    const { state, dispatch } = editor.view;
    try {
      const rect = selectedRect(state);
      const map = TableMap.get(rect.table);
      let tr = state.tr;
      const seen = new Set<number>();
      for (let i = 0; i < map.map.length; i++) {
        const cellPos = rect.tableStart + map.map[i];
        if (seen.has(cellPos)) continue;
        seen.add(cellPos);
        const cell = tr.doc.nodeAt(cellPos);
        if (cell && cell.attrs.colwidth) {
          tr = tr.setNodeMarkup(cellPos, null, {
            ...cell.attrs,
            colwidth: null,
          });
        }
      }
      dispatch(tr);
    } catch (err) {
      console.warn('Could not distribute columns:', err);
    }
  };

  // Adjust row height / padding (+/- delta in px)
  const adjustRowHeight = (delta: number) => {
    if (!editor) return;
    const { state, dispatch } = editor.view;
    try {
      const rect = selectedRect(state);
      const map = TableMap.get(rect.table);
      const rowIndex = rect.top;
      let tr = state.tr;

      const firstCellPos = rect.tableStart + map.map[rowIndex * map.width];
      const firstCell = tr.doc.nodeAt(firstCellPos);
      let currentPadding = 10;
      if (firstCell?.attrs?.style) {
        const match = firstCell.attrs.style.match(/padding:\s*(\d+)px/);
        if (match) currentPadding = parseInt(match[1], 10);
      }
      const newPadding = Math.max(4, Math.min(36, currentPadding + delta));
      const newStyle = `padding: ${newPadding}px 10px; vertical-align: top;`;

      for (let col = 0; col < map.width; col++) {
        const cellPos = rect.tableStart + map.map[rowIndex * map.width + col];
        const cell = tr.doc.nodeAt(cellPos);
        if (cell) {
          tr = tr.setNodeMarkup(cellPos, null, {
            ...cell.attrs,
            style: newStyle,
          });
        }
      }
      dispatch(tr);
    } catch (err) {
      console.warn('Could not adjust row height:', err);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 bg-white text-gray-800 rounded-lg px-3 py-1.5 text-xs shadow-sm transition-all animate-in fade-in slide-in-from-top-1 border border-gray-200 select-none',
        className
      )}
    >
      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mr-1">
        Table:
      </span>

      {/* Row Operations */}
      <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
        <span className="text-[10px] text-gray-500 font-semibold mr-0.5">Row:</span>
        <button
          type="button"
          onClick={() => editor.chain().focus().addRowAfter().run()}
          className="px-1.5 py-0.5 rounded hover:bg-emerald-50 text-emerald-700 flex items-center gap-0.5 transition-colors cursor-pointer"
          title="Add Row Below"
        >
          <Plus className="h-3 w-3 text-emerald-600" />
          <span>Add</span>
        </button>

        <button
          type="button"
          disabled={!editor.can().deleteRow()}
          onClick={() => editor.chain().focus().deleteRow().run()}
          className="px-1.5 py-0.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-30 flex items-center gap-0.5 transition-colors cursor-pointer"
          title="Delete Current Row"
        >
          <Trash2 className="h-3 w-3 text-red-500" />
          <span>Del</span>
        </button>

        {/* Row Height */}
        <div className="h-3 w-px bg-gray-200 mx-0.5" />
        <button
          type="button"
          onClick={() => adjustRowHeight(4)}
          className="px-1.5 py-0.5 rounded hover:bg-blue-50 text-blue-700 flex items-center gap-0.5 transition-colors cursor-pointer"
          title="Increase Row Height (Taller)"
        >
          <ArrowUpDown className="h-3 w-3 text-blue-500" />
          <span>H+</span>
        </button>

        <button
          type="button"
          onClick={() => adjustRowHeight(-4)}
          className="px-1.5 py-0.5 rounded hover:bg-gray-100 text-gray-700 flex items-center gap-0.5 transition-colors cursor-pointer"
          title="Decrease Row Height (Compact)"
        >
          <ArrowUpDown className="h-3 w-3 text-gray-400" />
          <span>H-</span>
        </button>
      </div>

      {/* Column Operations */}
      <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
        <span className="text-[10px] text-gray-500 font-semibold mr-0.5">Col:</span>
        <button
          type="button"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          className="px-1.5 py-0.5 rounded hover:bg-emerald-50 text-emerald-700 flex items-center gap-0.5 transition-colors cursor-pointer"
          title="Add Column Right"
        >
          <Plus className="h-3 w-3 text-emerald-600" />
          <span>Add</span>
        </button>

        <button
          type="button"
          disabled={!editor.can().deleteColumn()}
          onClick={() => editor.chain().focus().deleteColumn().run()}
          className="px-1.5 py-0.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-30 flex items-center gap-0.5 transition-colors cursor-pointer"
          title="Delete Current Column"
        >
          <Trash2 className="h-3 w-3 text-red-500" />
          <span>Del</span>
        </button>

        {/* Column Width */}
        <div className="h-3 w-px bg-gray-200 mx-0.5" />
        <button
          type="button"
          onClick={() => adjustColumnWidth(30)}
          className="px-1.5 py-0.5 rounded hover:bg-amber-50 text-amber-700 flex items-center gap-0.5 transition-colors cursor-pointer"
          title="Widen Column (W+)"
        >
          <ArrowLeftRight className="h-3 w-3 text-amber-500" />
          <span>W+</span>
        </button>

        <button
          type="button"
          onClick={() => adjustColumnWidth(-30)}
          className="px-1.5 py-0.5 rounded hover:bg-gray-100 text-gray-700 flex items-center gap-0.5 transition-colors cursor-pointer"
          title="Narrow Column (W-)"
        >
          <ArrowLeftRight className="h-3 w-3 text-gray-400" />
          <span>W-</span>
        </button>

        <button
          type="button"
          onClick={distributeColumnsEvenly}
          className="px-1.5 py-0.5 rounded hover:bg-blue-50 text-blue-700 flex items-center gap-0.5 transition-colors cursor-pointer"
          title="Distribute / Equalize All Column Widths (100% Full Width)"
        >
          <StretchHorizontal className="h-3 w-3 text-blue-500" />
          <span>Equalize</span>
        </button>
      </div>

      {/* Merge / Split */}
      <button
        type="button"
        disabled={!editor.can().mergeOrSplit()}
        onClick={() => editor.chain().focus().mergeOrSplit().run()}
        className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200 hover:bg-indigo-50 text-indigo-700 disabled:opacity-30 flex items-center gap-1 transition-colors cursor-pointer"
        title="Merge or Split Selected Cells"
      >
        <Combine className="h-3 w-3" />
        <span>Merge/Split</span>
      </button>

      {/* Delete Entire Table */}
      <button
        type="button"
        onClick={() => editor.chain().focus().deleteTable().run()}
        className="px-2 py-0.5 rounded bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 flex items-center gap-1 transition-colors cursor-pointer ml-auto"
        title="Delete Entire Table"
      >
        <Trash2 className="h-3 w-3" />
        <span>Delete Table</span>
      </button>
    </div>
  );
};
