import { useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ListTodo,
  Loader2,
  Plus,
  Trash2,
  Check,
} from 'lucide-react'
import type { SubTask } from '@/types/work'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Popconfirm } from 'antd'

type SubtasksMilestoneTrackerProps = {
  mainTaskTitle: string
  isMainCompleted: boolean
  onToggleMainCompleted: () => void
  subtasks: SubTask[]
  onAddSubtask: () => void
  onToggleSubtask: (subtaskId: string) => void
  onUpdateSubtaskTitle: (subtaskId: string, title: string) => void
  onUpdateSubtaskDescription: (subtaskId: string, description: string) => void
  onRemoveSubtask: (subtaskId: string) => void
  onSubtaskBlur?: () => void
  canEdit?: boolean
  isSaving?: boolean
  savedRecently?: boolean
  readOnly?: boolean
  embedded?: boolean
  className?: string
  isCreate?: boolean
  showMainDeliverable?: boolean
  showCheckboxes?: boolean
}

export function SubtasksMilestoneTracker({
  mainTaskTitle,
  isMainCompleted,
  onToggleMainCompleted,
  subtasks,
  onAddSubtask,
  onToggleSubtask,
  onUpdateSubtaskTitle,
  onUpdateSubtaskDescription,
  onRemoveSubtask,
  onSubtaskBlur,
  canEdit = true,
  isSaving = false,
  savedRecently = false,
  readOnly = false,
  embedded = false,
  className,
  isCreate = false,
  showMainDeliverable = !isCreate,
  showCheckboxes = !isCreate,
}: SubtasksMilestoneTrackerProps) {
  // Track collapsed state per subtask (by default, newly created subtasks are expanded)
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({})

  const toggleCollapse = (id: string) => {
    setCollapsedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Dynamic milestone derivation - Primary task is ALWAYS included as 1 deliverable
  const totalDeliverables = 1 + subtasks.length
  const completedDeliverables =
    (isMainCompleted ? 1 : 0) + subtasks.filter((s) => s.isCompleted).length
  const progressPercent = Math.round((completedDeliverables / totalDeliverables) * 100)
  const isAllCompleted = progressPercent === 100

  const statusIndicator = (
    <div className="flex items-center gap-2">
      {isSaving && (
        <span className="flex items-center gap-1 text-[11px] text-brand-blue font-medium animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </span>
      )}
      {!isSaving && savedRecently && (
        <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Saved
        </span>
      )}
      {!isSaving && !savedRecently && canEdit && !readOnly && (
        <span className="text-[11px] text-muted-foreground/80">
          Auto-saves on change
        </span>
      )}
    </div>
  )

  const innerContent = (
    <>
      {/* Progress Metric & Visual Bar (Only when tracking progress, not in create mode) */}
      {!isCreate && (
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">Overall Progress</span>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold border bg-brand-blue/10 text-brand-blue border-brand-blue/20"
              >
                {progressPercent}%
              </span>
            </div>
            <span className="text-xs font-medium text-foreground">
              {completedDeliverables} of {totalDeliverables} deliverables completed
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted shadow-inner">
            <div
              className="h-full transition-all duration-500 rounded-full bg-brand-blue"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Deliverables Breakdown */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isCreate ? 'Subtasks Breakdown' : 'Deliverables Checklist'}
            </Label>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium text-muted-foreground">
              {isCreate
                ? `${subtasks.length} ${subtasks.length === 1 ? 'task' : 'tasks'}`
                : `${completedDeliverables}/${totalDeliverables}`}
            </Badge>
          </div>

          {canEdit && !readOnly && (
            <Button
              type="button"
              onClick={onAddSubtask}
              size="sm"
              className="gap-1 text-xs bg-brand-blue hover:bg-brand-blue/90 !text-white h-7 px-2.5 shadow-xs cursor-pointer font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Subtask
            </Button>
          )}
        </div>

        {/* Primary Task Deliverable Row (Only shown when showMainDeliverable is true) */}
        {!isCreate && showMainDeliverable && (
          <div className="group flex items-center gap-2.5 rounded-lg border border-border/80 bg-card px-3.5 py-2.5 transition-all shadow-2xs">
            {showCheckboxes && (
              <button
                type="button"
                disabled={!canEdit || readOnly}
                onClick={onToggleMainCompleted}
                className={cn(
                  'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer',
                  isMainCompleted
                    ? 'bg-brand-blue border-brand-blue text-white'
                    : 'border-input hover:border-brand-blue bg-background text-transparent',
                  (!canEdit || readOnly) && 'cursor-not-allowed opacity-60',
                )}
                title={isMainCompleted ? 'Mark primary task as pending' : 'Mark primary task as completed'}
              >
                {isMainCompleted && <Check className="h-3 w-3 stroke-[2.5]" />}
              </button>
            )}

            <span className="text-xs font-medium flex-1 min-w-0 truncate text-foreground">
              {mainTaskTitle.trim() || 'Primary Task Deliverable'}
            </span>

            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1.5 shrink-0 font-medium border-border text-muted-foreground bg-muted/20"
            >
              Primary Task
            </Badge>

            <Badge
              variant="outline"
              className={cn(
                'text-[10px] py-0 px-1.5 font-medium shrink-0',
                isMainCompleted
                  ? 'border-brand-blue/30 text-brand-blue bg-brand-blue/5'
                  : 'border-border text-muted-foreground bg-muted/20',
              )}
            >
              {isMainCompleted ? 'Done' : 'Pending'}
            </Badge>
          </div>
        )}

        {/* Subtasks List */}
        {subtasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-6 text-center bg-muted/10">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-2">
              <ListTodo className="h-4.5 w-4.5" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">No subtasks added yet</h4>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-sm">
              Break this assessment down into smaller subtasks with individual headings and rich-text specifications.
            </p>
            {canEdit && !readOnly && (
              <Button
                type="button"
                onClick={onAddSubtask}
                size="sm"
                variant="outline"
                className="mt-3 gap-1.5 text-xs h-7.5 px-3 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Subtask
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {subtasks.map((subtask, index) => {
              const isCollapsed = Boolean(collapsedMap[subtask.id])

              return (
                <div
                  key={subtask.id}
                  className="rounded-xl border border-border/80 bg-card hover:border-border transition-all duration-200 overflow-hidden shadow-2xs"
                >
                  {/* Subtask Header Bar */}
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-muted/20 border-b border-border/60">
                    {showCheckboxes ? (
                      <button
                        type="button"
                        disabled={!canEdit || readOnly}
                        onClick={() => onToggleSubtask(subtask.id)}
                        className={cn(
                          'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer',
                          subtask.isCompleted
                            ? 'bg-brand-blue border-brand-blue text-white'
                            : 'border-input hover:border-brand-blue bg-background text-transparent',
                          (!canEdit || readOnly) && 'cursor-not-allowed opacity-60',
                        )}
                        title={
                          subtask.isCompleted
                            ? 'Mark subtask as pending'
                            : 'Mark subtask as completed'
                        }
                      >
                        {subtask.isCompleted && <Check className="h-3 w-3 stroke-[2.5]" />}
                      </button>
                    ) : (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted/60 text-[10px] font-semibold text-muted-foreground">
                        #{index + 1}
                      </span>
                    )}

                    <div className="flex-1 min-w-0">
                      {canEdit && !readOnly ? (
                        <Input
                          value={subtask.title}
                          onChange={(e) => onUpdateSubtaskTitle(subtask.id, e.target.value)}
                          onBlur={onSubtaskBlur}
                          placeholder={`Subtask #${index + 1} heading...`}
                          className="h-7.5 text-xs font-medium bg-background border-input focus-visible:ring-1 focus-visible:ring-brand-blue text-foreground"
                        />
                      ) : (
                        <span className="text-xs font-medium text-foreground">
                          {subtask.title || `Subtask #${index + 1}`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {showCheckboxes && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] py-0 px-1.5 font-medium',
                            subtask.isCompleted
                              ? 'border-brand-blue/30 text-brand-blue bg-brand-blue/5'
                              : 'border-border text-muted-foreground bg-muted/20',
                          )}
                        >
                          {subtask.isCompleted ? 'Done' : 'Pending'}
                        </Badge>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleCollapse(subtask.id)}
                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                        title={isCollapsed ? 'Expand subtask details' : 'Collapse subtask details'}
                      >
                        {isCollapsed ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronUp className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {canEdit && !readOnly && (
                        <Popconfirm
                          title="Delete Subtask"
                          description="Are you sure you want to remove this subtask?"
                          okText="Yes, delete"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true, size: 'small' }}
                          cancelButtonProps={{ size: 'small' }}
                          onConfirm={() => onRemoveSubtask(subtask.id)}
                        >
                          <button
                            type="button"
                            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete subtask"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </Popconfirm>
                      )}
                    </div>
                  </div>

                  {/* Subtask Rich-Text Body */}
                  {!isCollapsed && (
                    <div className="p-3.5 space-y-2 bg-card">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-medium text-muted-foreground">
                          Subtask Specifications & Acceptance Criteria
                        </Label>
                      </div>
                      <div onBlur={onSubtaskBlur}>
                        <RichTextEditor
                          value={subtask.description || ''}
                          onChange={(content) => onUpdateSubtaskDescription(subtask.id, content)}
                          placeholder="Provide subtask details, requirements, checklists, links..."
                          minHeight="110px"
                          readOnly={!canEdit || readOnly}
                          disabled={!canEdit || readOnly}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )

  if (embedded) {
    return (
      <div className={cn('pt-5 border-t border-border/70 space-y-4', className)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {isCreate ? 'Subtasks' : 'Subtasks & Milestones Tracking'}
              </Label>
              {!isCreate && isAllCompleted && (
                <Badge variant="outline" className="border-brand-blue/30 text-brand-blue bg-brand-blue/5 text-[10px] py-0 px-2 font-medium">
                  100% Completed
                </Badge>
              )}
            </div>
            <p className="text-[11px] mt-0.5 text-muted-foreground">
              {isCreate
                ? 'Break this assessment down into smaller subtasks with individual headings and specifications.'
                : 'Progress is automatically calculated from the completion of the primary task and subtasks.'}
            </p>
          </div>

          {statusIndicator}
        </div>

        <div className="space-y-4">{innerContent}</div>
      </div>
    )
  }

  return (
    <Card className={cn('gap-4 py-5 shadow-sm border-border/80', className)}>
      <CardHeader className="px-5 pb-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                {isCreate ? 'Subtasks Breakdown' : '3. Milestones & Subtasks Progress Tracking'}
              </CardTitle>
              {!isCreate && isAllCompleted && (
                <Badge variant="outline" className="border-brand-blue/30 text-brand-blue bg-brand-blue/5 text-[10px] py-0 px-2 font-medium">
                  100% Completed
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs mt-0.5 text-muted-foreground">
              {isCreate
                ? 'Break this assessment down into smaller subtasks with individual headings and specifications.'
                : 'Progress is automatically calculated from the completion of the main task deliverable and subtasks.'}
            </CardDescription>
          </div>

          {statusIndicator}
        </div>
      </CardHeader>

      <CardContent className="px-5 space-y-4">{innerContent}</CardContent>
    </Card>
  )
}
