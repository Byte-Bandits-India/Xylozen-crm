import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { WorkItem, WorkStatus, Priority } from '@/types/work'
import { KanbanColumn } from './KanbanColumn'
import { WorkCard } from './WorkCard'

type KanbanBoardProps = {
  mode: 'status' | 'priority'
  items: WorkItem[]
  onMoveItem: (
    itemId: string,
    newStatus?: WorkStatus,
    newPriority?: Priority,
    overId?: string
  ) => void
}

type StatusColumn = {
  id: WorkStatus
  title: string
  color: string
}

type PriorityColumn = {
  id: Priority
  title: string
  color: string
}

const STATUS_COLUMNS: StatusColumn[] = [
  { id: 'new', title: 'New', color: 'bg-kanban-board-circle-cyan' },
  { id: 'todo', title: 'To do', color: 'bg-kanban-board-circle-blue' },
  {
    id: 'clarifications',
    title: 'Clarifications / Doubts',
    color: 'bg-kanban-board-circle-yellow',
  },
  {
    id: 'under_analysis',
    title: 'Under analysis',
    color: 'bg-kanban-board-circle-purple',
  },
  { id: 'approval', title: 'Approval', color: 'bg-kanban-board-circle-green' },
]

const PRIORITY_COLUMNS: PriorityColumn[] = [
  { id: 'high', title: 'High Priority', color: 'bg-kanban-board-circle-red' },
  {
    id: 'medium',
    title: 'Medium Priority',
    color: 'bg-kanban-board-circle-yellow',
  },
  { id: 'low', title: 'Low Priority', color: 'bg-kanban-board-circle-blue' },
]

export function KanbanBoard({ mode, items, onMoveItem }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const navigate = useNavigate()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeItemId = active.id as string
    const overTargetId = over.id as string

    // Find the item being moved
    const draggedItem = items.find(
      (item) => item.id === activeItemId || (item as any).publicId === activeItemId
    )
    if (!draggedItem) {
      setActiveId(null)
      return
    }

    // Determine target column and whether we dropped on another card
    let targetStatus: WorkStatus | undefined = undefined
    let targetPriority: Priority | undefined = undefined
    let overCardId: string | undefined = undefined

    if (mode === 'status') {
      const validStatusIds = STATUS_COLUMNS.map((c) => c.id)
      if (validStatusIds.includes(overTargetId as WorkStatus)) {
        // Dropped directly on a column container
        targetStatus = overTargetId as WorkStatus
      } else {
        // Dropped on another card
        const overCard = items.find(
          (item) => item.id === overTargetId || (item as any).publicId === overTargetId
        )
        if (overCard) {
          targetStatus = overCard.status
          overCardId = overCard.id
        }
      }

      if (targetStatus) {
        onMoveItem(activeItemId, targetStatus, undefined, overCardId)
      }
    } else {
      const validPriorityIds = PRIORITY_COLUMNS.map((c) => c.id)
      if (validPriorityIds.includes(overTargetId as Priority)) {
        // Dropped directly on a column container
        targetPriority = overTargetId as Priority
      } else {
        // Dropped on another card
        const overCard = items.find(
          (item) => item.id === overTargetId || (item as any).publicId === overTargetId
        )
        if (overCard) {
          targetPriority = overCard.priority
          overCardId = overCard.id
        }
      }

      if (targetPriority) {
        onMoveItem(activeItemId, undefined, targetPriority, overCardId)
      }
    }

    setActiveId(null)
  }

  const activeItem = activeId
    ? items.find((item) => item.id === activeId)
    : null

  const columns = mode === 'status' ? STATUS_COLUMNS : PRIORITY_COLUMNS

  const getColumnItems = (columnId: string) => {
    if (mode === 'status') {
      return items.filter((item) => item.status === columnId)
    } else {
      return items.filter((item) => item.priority === columnId)
    }
  }

  const handleAddTaskForColumn = (columnId: string) => {
    if (mode === 'status') {
      navigate(`/work/create?status=${columnId}`)
    } else {
      navigate(`/work/create?priority=${columnId}`)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            items={getColumnItems(column.id)}
            color={column.color}
            showStatus={mode === 'priority'}
            onAddTask={() => handleAddTaskForColumn(column.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? (
          <WorkCard item={activeItem} showStatus={mode === 'priority'} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
