import { useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import {
  MoreVertical,
  Paperclip,
  Flag,
  Trash2,
  FileEdit,
  ExternalLink,
} from 'lucide-react'
import { Dropdown, type MenuProps } from 'antd'
import type { WorkItem } from '@/types/work'
import { cn } from '@/lib/utils'
import { useAppDispatch } from '@/hooks/redux'
import { deleteWorkItem, moveWorkItem } from '@/store/workSlice'
import { workService } from '@/services/workService'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

type WorkCardProps = {
  item: WorkItem
  showStatus?: boolean
}

export function WorkCard({ item }: WorkCardProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, isAdmin, isSuperAdmin, isManager } = useAuth()
  const pointerStartPos = useRef<{ x: number; y: number } | null>(null)
  const isCreator = !!(user && (item as any).createdByPublicId === user.publicId)
  const isItemManager = !!(user && ((item as any).managerPublicId === user.publicId || (item as any).managerPublicId === user.id))
  const canManage = isAdmin || isSuperAdmin || isItemManager || isCreator
  const canSetPriority = isAdmin || isSuperAdmin || isItemManager
  const canDelete = isAdmin || isSuperAdmin

  const handleOpenDetails = () => {
    navigate(`/work/details/${item.id}`)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartPos.current = { x: e.clientX, y: e.clientY }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragging) return
    if (pointerStartPos.current) {
      const dx = Math.abs(e.clientX - pointerStartPos.current.x)
      const dy = Math.abs(e.clientY - pointerStartPos.current.y)
      if (dx > 6 || dy > 6) {
        return
      }
    }
    handleOpenDetails()
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const menuItems: MenuProps['items'] = [
    {
      key: 'view-details',
      icon: <ExternalLink className="h-3.5 w-3.5" />,
      label: 'Open Details',
      onClick: handleOpenDetails,
    },
    ...(canManage
      ? [
          {
            key: 'edit-assessment',
            icon: <FileEdit className="h-3.5 w-3.5" />,
            label: isManager && !isAdmin ? 'Edit / Assign Workers' : 'Edit Assessment',
            onClick: () => navigate(`/work/edit/${item.id}`),
          },
        ]
      : []),
    ...(canSetPriority
      ? [
          { type: 'divider' as const },
          {
            key: 'priority-group',
            label: 'Set Priority',
            children: [
              {
                key: 'p-high',
                label: 'High Priority',
                onClick: () => {
                  workService.updateWorkItemPriority(item.id, 'high')
                  dispatch(moveWorkItem({ id: item.id, priority: 'high' }))
                },
              },
              {
                key: 'p-medium',
                label: 'Medium Priority',
                onClick: () => {
                  workService.updateWorkItemPriority(item.id, 'medium')
                  dispatch(moveWorkItem({ id: item.id, priority: 'medium' }))
                },
              },
              {
                key: 'p-low',
                label: 'Low Priority',
                onClick: () => {
                  workService.updateWorkItemPriority(item.id, 'low')
                  dispatch(moveWorkItem({ id: item.id, priority: 'low' }))
                },
              },
            ],
          },
        ]
      : []),
    {
      type: 'divider',
    },
    {
      key: 'status-group',
      label: 'Move Status',
      children: [
        {
          key: 's-new',
          label: 'New',
          onClick: () => {
            workService.updateWorkItemStatus(item.id, 'new')
            dispatch(moveWorkItem({ id: item.id, status: 'new' }))
          },
        },
        {
          key: 's-todo',
          label: 'To do',
          onClick: () => {
            workService.updateWorkItemStatus(item.id, 'todo')
            dispatch(moveWorkItem({ id: item.id, status: 'todo' }))
          },
        },
        {
          key: 's-clarifications',
          label: 'Clarifications / Doubts',
          onClick: () => {
            workService.updateWorkItemStatus(item.id, 'clarifications')
            dispatch(moveWorkItem({ id: item.id, status: 'clarifications' }))
          },
        },
        {
          key: 's-under_analysis',
          label: 'Under analysis',
          onClick: () => {
            workService.updateWorkItemStatus(item.id, 'under_analysis')
            dispatch(moveWorkItem({ id: item.id, status: 'under_analysis' }))
          },
        },
        {
          key: 's-approval',
          label: 'Approval',
          onClick: () => {
            workService.updateWorkItemStatus(item.id, 'approval')
            dispatch(moveWorkItem({ id: item.id, status: 'approval' }))
          },
        },
      ],
    },
    ...(canDelete
      ? [
          { type: 'divider' as const },
          {
            key: 'delete',
            danger: true,
            icon: <Trash2 className="h-3.5 w-3.5" />,
            label: 'Delete Work Item',
            onClick: () => {
              workService.deleteWorkItem(item.id)
              dispatch(deleteWorkItem(item.id))
            },
          },
        ]
      : []),
  ]

  const subtaskList = Array.isArray(item.subtasks) ? item.subtasks : []
  const isMainDone = Boolean(item.isMainCompleted || item.status === 'approval')
  const totalMilestones = 1 + subtaskList.length
  const completedMilestones = (isMainDone ? 1 : 0) + subtaskList.filter((s) => s.isCompleted).length
  const milestonePercent = Math.round(
    (completedMilestones / totalMilestones) * 100
  )
  const primaryAssignee = Array.isArray(item.assignees) && item.assignees.length > 0 ? item.assignees[0] : null
  const attachmentsCount = item.attachmentsCount || (Array.isArray(item.attachments) ? item.attachments.length : 0)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        handlePointerDown(e)
        listeners?.onPointerDown?.(e)
      }}
      onClick={handleCardClick}
      className={cn(
        'group relative bg-card border-border/80 rounded-xl border p-3.5 shadow-2xs transition-all hover:shadow-md hover:border-brand-blue/40 cursor-grab active:cursor-grabbing flex flex-col justify-between h-[146px]',
        isDragging && 'opacity-50 ring-2 ring-brand-blue',
      )}
    >
      {/* Title & Subtle Action Menu */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-foreground text-[14px] font-bold tracking-normal leading-snug line-clamp-2 h-[38px]">
          {item.title}
        </h3>
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mt-0.5 -mr-1"
        >
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* Milestone Progress Row & Bar */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-500 dark:text-gray-400">Milestone</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold bg-[#EDEAFE] text-[#5542F6] dark:bg-brand-blue/20 dark:text-brand-blue leading-none">
              {milestonePercent}%
            </span>
            <span className="text-gray-400 dark:text-gray-500 text-xs font-normal">
              ({completedMilestones}/{totalMilestones})
            </span>
          </div>
        </div>

        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-muted">
          <div
            className="h-full rounded-full bg-[#1E2B58] dark:bg-brand-blue transition-all duration-300"
            style={{ width: `${Math.min(100, milestonePercent)}%` }}
          />
        </div>
      </div>

      {/* Footer Row: Priority Pill, Role · Affiliation Pill, Attachments Count */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2 flex-nowrap min-w-0 overflow-hidden">
          {/* Priority Pill */}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 leading-none',
              item.priority === 'high'
                ? 'bg-[#FDF2F4] text-[#E13454] border-[#FCD7DE] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40'
                : item.priority === 'low'
                ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40'
                : 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40'
            )}
          >
            <Flag className="h-3 w-3 fill-current" />
            <span className="capitalize">{item.priority || 'Medium'}</span>
          </span>

          {/* Role · Affiliation Pill */}
          {primaryAssignee && (
            <span
              className="inline-flex items-center rounded-md bg-[#F0EEFF] text-[#6355E8] dark:bg-purple-950/40 dark:text-purple-300 px-2.5 py-0.5 text-xs font-medium truncate max-w-[140px] leading-none"
              title={`${primaryAssignee.name} (${primaryAssignee.role})`}
            >
              {primaryAssignee.role || 'Staff'} · {primaryAssignee.affiliation === 'external' ? 'Ext' : 'Int'}
            </span>
          )}
        </div>

        {/* Attachments */}
        {attachmentsCount > 0 && (
          <div
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-auto"
            title={`${attachmentsCount} attachment${attachmentsCount > 1 ? 's' : ''}`}
          >
            <Paperclip className="h-3.5 w-3.5 -rotate-45" />
            <span className="font-medium">{attachmentsCount}</span>
          </div>
        )}
      </div>
    </div>
  )
}
