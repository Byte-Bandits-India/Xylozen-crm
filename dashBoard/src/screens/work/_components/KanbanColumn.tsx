import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { WorkItem } from '@/types/work'
import { cn } from '@/lib/utils'
import { WorkCard } from './WorkCard'
import { Button } from '@/components/ui/button'

type KanbanColumnProps = {
  id: string
  title: string
  items: WorkItem[]
  color: string
  showStatus?: boolean
  onAddTask?: () => void
}

export function KanbanColumn({
  id,
  title,
  items,
  color,
  showStatus,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex min-w-[320px] max-w-[340px] flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'h-2.5 w-2.5 rounded-full ring-2 ring-offset-1 ring-offset-background ring-border',
              color,
            )}
          />
          <h3 className="text-foreground text-sm font-medium tracking-tight">
            {title}
          </h3>
          <span className="bg-muted/80 text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
            {items.length}
          </span>
        </div>
        {onAddTask && (
          <Button
            onClick={onAddTask}
            title={`Add new assessment to ${title}`}
            variant="ghost"
            size="icon-sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'bg-gray-50/70 dark:bg-gray-900/30 flex-1 space-y-3 rounded-xl p-3 border border-gray-300 dark:border-gray-700 min-h-[520px] transition-colors',
          isOver && 'bg-brand-blue/5 ring-2 ring-brand-blue/40 border-brand-blue',
        )}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <WorkCard key={item.id} item={item} showStatus={showStatus} />
          ))}
        </SortableContext>

        {items.length === 0 && (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-gray-900/50 p-4 text-center">
            <span className="text-muted-foreground text-xs font-medium">
              No tasks in this column
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
