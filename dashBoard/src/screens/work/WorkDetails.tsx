import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronDown,
  Download,
  File,
  FileText,
  Image as ImageIcon,
  UploadCloud,
  X,
  ArrowLeft,
  Trash2,
  Paperclip,
  Loader2,
  CheckCircle2,
  Check,
} from 'lucide-react'
import { format, isValid } from 'date-fns'
import { message, Popconfirm, Select } from 'antd'
import {
  getScopedAssignees,
  buildGroupedAssigneeOptions,
} from './utils/assigneeFilter'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import {
  deleteWorkItem,
  updateWorkItem as updateWorkItemRedux,
} from '@/store/workSlice'
import { useAuth } from '@/context/AuthContext'
import { workService } from '@/services/workService'
import { mapApiUserToAssignee } from '@/services/roleService'
import { apiClient } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'
import { WORK_STATUS_OPTIONS_WITH_DESC } from '@/data/options'
import type {
  WorkItem,
  WorkStatus,
  Priority,
  Assignee,
  WorkAttachment,
  SubTask,
} from '@/types/work'
import { SubtasksMilestoneTracker } from './_components/SubtasksMilestoneTracker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export default function WorkDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user, isAdmin, isSuperAdmin, isManager } = useAuth()

  // State flags & helpers
  const [isSaving, setIsSaving] = useState(false)
  const [primaryTarget, setPrimaryTarget] = useState<'status' | 'priority'>('status')
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [previewImage, setPreviewImage] = useState<{
    url: string
    name: string
  } | null>(null)

  // 1. Get from Redux state for instant cache rendering
  const reduxWorkItem = useAppSelector((state) =>
    state.work.workItems.find((w) => w.id === id || (w as any).publicId === id)
  )

  // 2. Fetch fresh item from API
  const {
    data: apiWorkItem,
    isLoading,
    refetch,
  } = useQuery<WorkItem>({
    queryKey: ['work-item-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('No id provided')
      try {
        const res = await apiClient.get(`/work-items/${id}`)
        return res.data?.data || res.data
      } catch {
        const items = await workService.getWorkItems()
        const found = items.find((w) => w.id === id || (w as any).publicId === id)
        if (found) return found
        throw new Error('Work item not found')
      }
    },
    enabled: !!id,
    placeholderData: reduxWorkItem,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  // Synchronize across windows/tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || e.key.includes('work_items')) {
        refetch()
        queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [id, refetch])

  const item = apiWorkItem || reduxWorkItem

  // Permissions
  const isAssignee = !!(
    user &&
    item?.assignees?.some(
      (a) =>
        (a.email && user.email && a.email.toLowerCase() === user.email.toLowerCase()) ||
        a.id === user.id ||
        a.id === user.publicId
    )
  )
  const isCreator = !!(user && item && (item as any).createdByPublicId === user.publicId)
  const isItemManager = !!(
    user &&
    item &&
    ((item as any).managerPublicId === user.publicId || (item as any).managerPublicId === user.id)
  )
  const canManage = isSuperAdmin || isAdmin || isManager || isItemManager || isCreator
  const canEditMilestones = canManage || isAssignee
  const canChangeStatus = canManage || isAssignee
  const canChangePriority = isSuperAdmin || isAdmin || isManager || isItemManager
  const canDelete = isSuperAdmin || isAdmin

  // Form State initialized from item
  const [title, setTitle] = useState(item?.title || '')
  const [description, setDescription] = useState(item?.description || '')
  const [priority, setPriority] = useState<Priority>(item?.priority || 'medium')
  const [status, setStatus] = useState<WorkStatus>(item?.status || 'new')
  const [subtasks, setSubtasksState] = useState<SubTask[]>(item?.subtasks || [])
  const [isMainCompleted, setIsMainCompleted] = useState<boolean>(
    Boolean(item?.isMainCompleted || item?.status === 'approval')
  )
  const [isUpdatingSubtasks, setIsUpdatingSubtasks] = useState(false)
  const [subtasksSavedRecently, setSubtasksSavedRecently] = useState(false)
  const [isUpdatingAssignees, setIsUpdatingAssignees] = useState(false)
  const [assigneesSavedRecently, setAssigneesSavedRecently] = useState(false)
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(
    item?.assignees?.map((a) => a.id) || []
  )
  const [attachments, setAttachments] = useState<WorkAttachment[]>(item?.attachments || [])

  // Auto-save subtasks and derived milestones handler
  const persistSubtasks = async (updatedSubtasks: SubTask[], mainDone: boolean) => {
    if (!item) return
    setIsUpdatingSubtasks(true)
    const total = 1 + updatedSubtasks.length
    const completed = (mainDone ? 1 : 0) + updatedSubtasks.filter((s) => s.isCompleted).length
    try {
      dispatch(
        updateWorkItemRedux({
          id: item.id,
          updates: {
            subtasks: updatedSubtasks,
            isMainCompleted: mainDone,
            milestone: { completed, total },
          },
        })
      )
      queryClient.setQueryData(['work-item-detail', id], (old: any) => {
        if (!old) return old
        return {
          ...old,
          subtasks: updatedSubtasks,
          isMainCompleted: mainDone,
          milestone: { completed, total },
        }
      })
      await workService.updateWorkItemSubtasks(item.id, updatedSubtasks, mainDone)
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
      setSubtasksSavedRecently(true)
      setTimeout(() => setSubtasksSavedRecently(false), 2500)
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to save subtasks')
    } finally {
      setIsUpdatingSubtasks(false)
    }
  }

  const handleAddSubtask = () => {
    if (!canManage) return
    const newSubtask: SubTask = {
      id: `sub-${crypto.randomUUID()}`,
      title: `Subtask ${subtasks.length + 1}`,
      description: '',
      isCompleted: false,
      createdAt: new Date().toISOString(),
    }
    const updated = [...subtasks, newSubtask]
    setSubtasksState(updated)
    persistSubtasks(updated, isMainCompleted)
  }

  const handleToggleSubtask = (subtaskId: string) => {
    if (!canEditMilestones) return
    const updated = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
    )
    setSubtasksState(updated)
    persistSubtasks(updated, isMainCompleted)
  }

  const handleToggleMainCompleted = () => {
    if (!canEditMilestones) return
    const newMainDone = !isMainCompleted
    setIsMainCompleted(newMainDone)
    persistSubtasks(subtasks, newMainDone)
  }

  const handleUpdateSubtaskTitle = (subtaskId: string, newTitle: string) => {
    if (!canManage) return
    setSubtasksState((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, title: newTitle } : s))
    )
  }

  const handleUpdateSubtaskDescription = (subtaskId: string, newDescription: string) => {
    if (!canManage) return
    setSubtasksState((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, description: newDescription } : s))
    )
  }

  const handleRemoveSubtask = (subtaskId: string) => {
    if (!canManage) return
    const updated = subtasks.filter((s) => s.id !== subtaskId)
    setSubtasksState(updated)
    persistSubtasks(updated, isMainCompleted)
  }

  const handleSubtaskBlur = () => {
    if (canManage) {
      persistSubtasks(subtasks, isMainCompleted)
    }
  }

  // Sync state whenever the underlying item ID changes or initial load completes
  useEffect(() => {
    if (item) {
      setTitle(item.title || '')
      setDescription(item.description || '')
      setPriority(item.priority || 'medium')
      setStatus(item.status || 'new')
      if (Array.isArray(item.subtasks) && !isUpdatingSubtasks) {
        setSubtasksState(item.subtasks)
      }
      if (!isUpdatingSubtasks) {
        setIsMainCompleted(Boolean(item.isMainCompleted || item.status === 'approval'))
      }
      if (Array.isArray(item.attachments)) {
        setAttachments(item.attachments)
      }
      if (Array.isArray(item.assignees)) {
        setSelectedAssigneeIds(item.assignees.map((a) => a.id))
      }
    }
  }, [item?.id])

  // Sync assignees from server polling if not actively editing
  useEffect(() => {
    if (item && Array.isArray(item.assignees) && !isUpdatingAssignees) {
      setSelectedAssigneeIds(item.assignees.map((a) => a.id))
    }
  }, [item?.assignees, isUpdatingAssignees])

  // Auto-save assignees handler directly updates backend, redux, and query caches
  const handleAssigneesUpdate = async (newIds: string[]) => {
    if (!item || !user) return
    setSelectedAssigneeIds(newIds)
    const newSelectedAssignees = allKnownMembers.filter((m) => newIds.includes(m.id))
    setIsUpdatingAssignees(true)

    try {
      const updates: Partial<WorkItem> = {
        assignees: newSelectedAssignees,
      }
      dispatch(updateWorkItemRedux({ id: item.id, updates }))
      queryClient.setQueryData(['work-item-detail', id], (old: any) =>
        old ? { ...old, ...updates } : old
      )

      await workService.updateWorkItem(item.id, updates)
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
      queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })

      setAssigneesSavedRecently(true)
      message.success(`Work assignment saved (${newSelectedAssignees.length} assigned)`)
      setTimeout(() => setAssigneesSavedRecently(false), 2500)
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to save assigned users')
    } finally {
      setIsUpdatingAssignees(false)
    }
  }

  const reduxTeamDirectory = useAppSelector((state) => state.work.teamDirectory)

  // Fetch assignable users for any authenticated user
  const { data: apiUsers = [] } = useQuery<Assignee[]>({
    queryKey: ['assignable-users', user?.publicId],
    queryFn: async () => {
      const users = await workService.getAssignableUsers()
      if (users && users.length > 0) return users
      try {
        const res = await apiClient.get('/admin/users?page=1&pageSize=100')
        const raw = res.data?.data || res.data || []
        return (Array.isArray(raw) ? raw : []).map(mapApiUserToAssignee)
      } catch {
        return []
      }
    },
    enabled: !!user,
  })

  const baseDirectory = apiUsers.length > 0 ? apiUsers : reduxTeamDirectory

  // Merge baseDirectory with existing assignees on item to ensure all current and available assignees display properly
  const allKnownMap = new Map<string, Assignee>()
  baseDirectory.forEach((m) => allKnownMap.set(m.id, m))
  ;(item?.assignees || []).forEach((m) => allKnownMap.set(m.id, m))
  const allKnownMembers = Array.from(allKnownMap.values())

  // Effective manager target for scoping (null for company-wide assignment)
  const effectiveTargetManagerId = null

  const selectedAssignees = allKnownMembers.filter((m) =>
    selectedAssigneeIds.includes(m.id)
  )

  // Filtered members by active affiliation tab
  const scopedMembers = getScopedAssignees({
    allMembers: allKnownMembers,
    currentUser: user,
    isAdmin,
    isManager,
    targetManagerPublicId: effectiveTargetManagerId,
    existingAssigneeIds: selectedAssigneeIds,
  })

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const handleFileUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    fileArray.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newAttachment: WorkAttachment = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          url: e.target?.result as string,
          uploadedAt: new Date().toISOString(),
        }
        setAttachments((prev) => [...prev, newAttachment])
      }
      reader.readAsDataURL(file)
    })
    message.success(`${fileArray.length} file${fileArray.length > 1 ? 's' : ''} added`)
  }

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
  }

  const handleToggleAssignee = (memberId: string) => {
    const newIds = selectedAssigneeIds.includes(memberId)
      ? selectedAssigneeIds.filter((id) => id !== memberId)
      : [...selectedAssigneeIds, memberId]
    handleAssigneesUpdate(newIds)
  }

  const handleDelete = async () => {
    if (!item) return
    dispatch(deleteWorkItem(item.id))
    try {
      await workService.deleteWorkItem(item.id)
    } catch {}
    queryClient.invalidateQueries({ queryKey: ['work-items'] })
    message.success('Assessment deleted successfully')
    navigate('/work/status-board')
  }

  const handleSave = async (targetBoard?: 'status' | 'priority' | 'stay') => {
    if (!item) return
    if (!title.trim()) {
      message.error('Assessment title is required.')
      return
    }

    setIsSaving(true)
    try {
      const totalDeliverables = 1 + subtasks.length
      const completedDeliverables =
        (isMainCompleted ? 1 : 0) + subtasks.filter((s) => s.isCompleted).length

      const updates: Partial<WorkItem> = {
        title: title.trim(),
        description,
        status,
        priority,
        subtasks,
        isMainCompleted,
        milestone: {
          total: totalDeliverables,
          completed: completedDeliverables,
        },
        assignees: selectedAssignees,
        attachments,
        attachmentsCount: attachments.length,
      }

      await workService.updateWorkItem(item.id, updates)
      await workService.updateWorkItemSubtasks(item.id, subtasks, isMainCompleted)

      dispatch(updateWorkItemRedux({ id: item.id, updates }))
      queryClient.setQueryData(['work-item-detail', id], (old: any) =>
        old ? { ...old, ...updates } : old
      )
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
      queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })

      message.success('Assessment updated successfully!')

      if (targetBoard === 'status') {
        navigate('/work/status-board')
      } else if (targetBoard === 'priority') {
        navigate('/work/impact-board')
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to update assessment')
    } finally {
      setIsSaving(false)
    }
  }

  const prioritySelectOptions = [
    {
      value: 'high',
      label: (
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 shrink-0 rounded-full bg-kanban-board-circle-red" />
          <span className="font-medium text-foreground">High Priority</span>
          <span className="text-muted-foreground text-[11px]">— Critical / blocker</span>
        </div>
      ),
    },
    {
      value: 'medium',
      label: (
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 shrink-0 rounded-full bg-kanban-board-circle-yellow" />
          <span className="font-medium text-foreground">Medium Priority</span>
          <span className="text-muted-foreground text-[11px]">— Standard sprint</span>
        </div>
      ),
    },
    {
      value: 'low',
      label: (
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 shrink-0 rounded-full bg-brand-blue" />
          <span className="font-medium text-foreground">Low Priority</span>
          <span className="text-muted-foreground text-[11px]">— Routine / maintenance</span>
        </div>
      ),
    },
  ]

  const assigneeSelectOptions = buildGroupedAssigneeOptions(
    scopedMembers,
    allKnownMembers
  )

  const renderSaveActions = (size: 'sm' | 'default' = 'sm') => {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={() => navigate('/work/status-board')}
          variant="outline"
          size={size}
          className="text-xs cursor-pointer"
        >
          Cancel
        </Button>

        <div className="inline-flex items-center rounded-lg shadow-xs overflow-hidden">
          <Button
            type="button"
            onClick={() => handleSave(primaryTarget)}
            disabled={isSaving}
            size={size}
            className={cn(
              'rounded-r-none gap-1.5 text-xs font-medium cursor-pointer border-r',
              primaryTarget === 'status'
                ? 'bg-brand-blue !text-white hover:bg-brand-blue/90 border-white/20'
                : 'bg-kanban-board-circle-yellow text-slate-950 hover:bg-kanban-board-circle-yellow/90 font-medium border-black/10'
            )}
          >
            {isSaving
              ? 'Saving...'
              : primaryTarget === 'status'
              ? 'Save & View on Status Board'
              : 'Save & View on Impact Board'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size={size}
                className={cn(
                  'rounded-l-none px-2 cursor-pointer',
                  primaryTarget === 'status'
                    ? 'bg-brand-blue !text-white hover:bg-brand-blue/90'
                    : 'bg-kanban-board-circle-yellow text-slate-950 hover:bg-kanban-board-circle-yellow/90'
                )}
                title="More save options"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 p-1.5 shadow-lg border border-border bg-popover z-50"
            >
              <DropdownMenuItem
                onClick={() => {
                  setPrimaryTarget('status')
                  handleSave('status')
                }}
                className="cursor-pointer gap-2 p-2 rounded-md hover:bg-accent focus:bg-accent"
              >
                <div className="h-2 w-2 rounded-full bg-brand-blue" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-medium text-foreground">
                    Save & View on Status Board
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Open workflow stages Kanban
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setPrimaryTarget('priority')
                  handleSave('priority')
                }}
                className="cursor-pointer gap-2 p-2 rounded-md hover:bg-accent focus:bg-accent"
              >
                <div className="h-2 w-2 rounded-full bg-kanban-board-circle-yellow" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-medium text-foreground">
                    Save & View on Impact Board
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Open priority calibration matrix
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSave('stay')}
                className="cursor-pointer gap-2 p-2 rounded-md hover:bg-accent focus:bg-accent"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-medium text-foreground">
                    Save Changes Here
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Update assessment without leaving
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  if (isLoading && !item) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading Assessment Details...</span>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <div className="rounded-full bg-muted p-4 text-muted-foreground">
          <FileText className="h-8 w-8" />
        </div>
        <h2 className="text-foreground text-xl font-medium">Assessment Not Found</h2>
        <p className="text-muted-foreground max-w-md text-xs">
          The requested work assessment with ID <code className="text-primary">{id}</code> could not be found or may have been deleted.
        </p>
        <Button
          onClick={() => navigate('/work/status-board')}
          variant="outline"
          size="sm"
          className="gap-2 text-xs font-medium cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Status Board
        </Button>
      </div>
    )
  }

  const dueDate = item.dueDate ? new Date(item.dueDate) : null
  const formattedDueDate = dueDate && isValid(dueDate) ? format(dueDate, 'dd MMMM, yyyy') : null

  const createdDate = item.createdAt ? new Date(item.createdAt) : null
  const formattedCreatedDate =
    createdDate && isValid(createdDate) ? format(createdDate, 'dd MMM yyyy, hh:mm a') : null

  return (
    <div className="min-h-screen w-full flex-1 overflow-y-auto bg-muted/20 p-6 lg:p-8">
      <div className="w-full space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-foreground text-2xl font-medium tracking-tight">
              {item.title}
            </h1>
            <div className="text-muted-foreground text-xs mt-0.5 flex flex-wrap items-center gap-3">
              <span>
                Assessment ID: <span className="font-mono text-foreground font-medium">{item.id}</span>
              </span>
              {formattedCreatedDate && <span>• Created: {formattedCreatedDate}</span>}
              {formattedDueDate && <span>• Target Due: {formattedDueDate}</span>}
            </div>
          </div>

          {/* Quick Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {canDelete && (
              <Popconfirm
                title="Delete this assessment?"
                description="Are you sure you want to permanently delete this assessment?"
                onConfirm={handleDelete}
                okText="Yes, Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:border-destructive/30 gap-1.5 text-xs cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </Button>
              </Popconfirm>
            )}

            {(canManage || isAssignee) && renderSaveActions('sm')}
          </div>
        </div>

        {/* 2-Column Responsive Layout (Exact Match with CreateAssessment) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column (Primary Scope & Attachments) */}
          <div className="space-y-6 lg:col-span-7 xl:col-span-8">
            {/* Card 1: Work Overview & Scope */}
            <Card className="gap-5 py-6 shadow-sm">
              <CardHeader className="px-6 pb-0">
                <CardTitle className="text-sm font-medium">
                  1. Work Overview & Scope
                </CardTitle>
              </CardHeader>

              <CardContent className="px-6 space-y-4">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block text-foreground">
                    Workflow Stage (Status Board)
                  </Label>
                  <Select
                    value={status}
                    disabled={!canChangeStatus}
                    onChange={(val) => setStatus(val as WorkStatus)}
                    className="w-full"
                    options={WORK_STATUS_OPTIONS_WITH_DESC.map((opt) => ({
                      value: opt.value,
                      label: `${opt.label} — ${opt.desc}`,
                    }))}
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium mb-1.5 block text-foreground">
                    Assessment Title <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={!canEditMilestones}
                      onClick={handleToggleMainCompleted}
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer',
                        isMainCompleted
                          ? 'bg-brand-blue border-brand-blue text-white'
                          : 'border-input hover:border-brand-blue bg-background text-transparent',
                        !canEditMilestones && 'cursor-not-allowed opacity-60',
                      )}
                      title={isMainCompleted ? 'Mark primary task as pending' : 'Mark primary task as completed'}
                    >
                      {isMainCompleted && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                    </button>
                    <Input
                      type="text"
                      placeholder="e.g. Payment Gateway Integration, Mobile Dashboard..."
                      value={title}
                      disabled={!canManage}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-10 text-sm flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium mb-1.5 block text-foreground">
                    Description & Context
                  </Label>
                  <RichTextEditor
                    value={description}
                    readOnly={!canManage}
                    onChange={setDescription}
                    placeholder="Provide scope of work, technical requirements, acceptance criteria..."
                  />
                </div>

                {/* Subtasks & Milestones Progress Tracking */}
                <div className="pt-2">
                  <SubtasksMilestoneTracker
                    mainTaskTitle={title}
                    isMainCompleted={isMainCompleted}
                    onToggleMainCompleted={handleToggleMainCompleted}
                    subtasks={subtasks}
                    onAddSubtask={handleAddSubtask}
                    onToggleSubtask={handleToggleSubtask}
                    onUpdateSubtaskTitle={handleUpdateSubtaskTitle}
                    onUpdateSubtaskDescription={handleUpdateSubtaskDescription}
                    onRemoveSubtask={handleRemoveSubtask}
                    onSubtaskBlur={handleSubtaskBlur}
                    canEdit={canEditMilestones}
                    isSaving={isUpdatingSubtasks}
                    savedRecently={subtasksSavedRecently}
                    embedded={true}
                    isCreate={false}
                    showMainDeliverable={true}
                    showCheckboxes={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 5: Attachments & Supporting Files */}
            <Card className="gap-5 py-6 shadow-sm">
              <CardHeader className="px-6 pb-0 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">
                      5. Attachments & Supporting Files
                    </CardTitle>
                    {attachments.length > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-brand-blue/10 text-brand-blue border-brand-blue/20 text-[11px]"
                      >
                        {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
                      </Badge>
                    )}
                  </div>
                </div>

                {attachments.length > 0 && canManage && (
                  <Button
                    type="button"
                    onClick={() => setAttachments([])}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive gap-1 cursor-pointer h-8"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove all
                  </Button>
                )}
              </CardHeader>

              <CardContent className="px-6 space-y-4">
                {/* Drag & Drop Upload Zone (Interactive for authorized managers/admins) */}
                {canManage && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDraggingFile(true)
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDraggingFile(false)
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleFileUpload(e.dataTransfer.files)
                      }
                    }}
                    onClick={() => {
                      document.getElementById('assessment-details-file-upload')?.click()
                    }}
                    className={cn(
                      'group relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all',
                      isDraggingFile
                        ? 'border-brand-blue bg-brand-blue/5 scale-[0.99]'
                        : 'border-border/80 bg-background/60 hover:border-brand-blue/50 hover:bg-muted/30'
                    )}
                  >
                    <input
                      id="assessment-details-file-upload"
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileUpload(e.target.files)
                          e.target.value = ''
                        }
                      }}
                    />

                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-foreground text-xs font-medium">
                          <span className="text-brand-blue underline">Click to upload</span> or drag & drop files here
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-[11px]">
                          Supports PNG, JPG, SVG, PDF, DOCX, XLSX (up to 25MB each)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Uploaded Attachments Grid */}
                {attachments.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-foreground">
                      Attached Files ({attachments.length}):
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {attachments.map((file) => {
                        const isImage =
                          file.type?.startsWith('image/') ||
                          /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(file.name)
                        const isPdf =
                          file.type?.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')

                        return (
                          <div
                            key={file.id}
                            className="group relative rounded-lg border border-border bg-background p-3 shadow-xs hover:border-brand-blue/40 transition-all flex flex-col justify-between"
                          >
                            {/* Preview Area */}
                            {isImage ? (
                              <div
                                onClick={() =>
                                  setPreviewImage({ url: file.url, name: file.name })
                                }
                                className="relative mb-2 h-28 w-full overflow-hidden rounded-md bg-muted/40 cursor-zoom-in"
                                title="Click to zoom preview"
                              >
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute top-1.5 left-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium !text-white flex items-center gap-1">
                                  <ImageIcon className="h-2.5 w-2.5" />
                                  IMG
                                </div>
                              </div>
                            ) : isPdf ? (
                              <div className="relative mb-2 flex h-28 w-full flex-col items-center justify-center rounded-md bg-red-500/10 text-red-500">
                                <FileText className="h-10 w-10 mb-1" />
                                <span className="text-[11px] font-medium">PDF Document</span>
                                <div className="absolute top-1.5 left-1.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-medium !text-white">
                                  PDF
                                </div>
                              </div>
                            ) : (
                              <div className="relative mb-2 flex h-28 w-full flex-col items-center justify-center rounded-md bg-brand-blue/10 text-brand-blue">
                                <File className="h-10 w-10 mb-1" />
                                <span className="text-[11px] font-medium">Attachment</span>
                                <div className="absolute top-1.5 left-1.5 rounded bg-brand-blue px-1.5 py-0.5 text-[10px] font-medium !text-white">
                                  DOC
                                </div>
                              </div>
                            )}

                            {/* File Details */}
                            <div className="min-w-0 flex-1">
                              <p
                                className="truncate text-xs font-medium text-foreground"
                                title={file.name}
                              >
                                {file.name}
                              </p>
                              <p className="text-muted-foreground mt-0.5 text-[11px]">
                                {formatFileSize(file.size)}
                              </p>
                            </div>

                            {/* Action Links */}
                            <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2">
                              <a
                                href={file.url}
                                download={file.name}
                                className="text-[11px] text-brand-blue hover:underline flex items-center gap-1 font-medium cursor-pointer"
                              >
                                <Download className="h-3 w-3" />
                                Download
                              </a>

                              {canManage && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAttachment(file.id)}
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1 rounded-md transition-colors cursor-pointer"
                                  title={`Remove ${file.name}`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center bg-muted/10">
                    <Paperclip className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-xs font-medium text-foreground">No attachments provided</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      No files or specifications were uploaded with this assessment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (Sidebar Sections: 2, 4, 3) */}
          <div className="space-y-6 lg:col-span-5 xl:col-span-4">
            {/* 2. Priority Check & Impact Calibration (Impact Board) */}
            <Card className="gap-4 py-5 shadow-sm">
              <CardHeader className="px-5 pb-0">
                <CardTitle className="text-sm font-medium">
                  2. Priority Check & Impact Calibration
                </CardTitle>
              </CardHeader>

              <CardContent className="px-5 space-y-2">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block text-foreground">
                    Priority Level
                  </Label>
                  <Select
                    value={priority}
                    disabled={!canChangePriority}
                    onChange={(val) => setPriority(val as Priority)}
                    className="w-full"
                    options={prioritySelectOptions}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 4. Work Assignment (Roles & Affiliations) */}
            <Card className="gap-4 py-5 shadow-sm">
              <CardHeader className="px-5 pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">
                      4. Work Assignment
                    </CardTitle>
                  </div>
                  {Boolean(user) && (
                    <div className="flex items-center gap-1.5">
                      {isUpdatingAssignees ? (
                        <span className="flex items-center gap-1 text-[11px] text-brand-blue font-medium">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Saving...
                        </span>
                      ) : assigneesSavedRecently ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Saved
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/80">
                          Auto-saves on change
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="px-5 space-y-3.5">
                {/* Antd Multi-Select Dropdown for All Authenticated Users */}
                {Boolean(user) && (
                  <div className="space-y-3">
                    {/* 3. Assignees Multi-Select with Quick Tabs */}
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                        <Label className="text-xs font-medium text-foreground">
                          Select Assignees
                        </Label>
                      </div>
                      <Select
                        mode="multiple"
                        placeholder="Search and assign any team member, contractor, manager, or admin..."
                        value={selectedAssigneeIds}
                        disabled={isUpdatingAssignees}
                        onChange={(ids: string[]) => handleAssigneesUpdate(ids)}
                        className="w-full"
                        options={assigneeSelectOptions}
                        tagRender={(props) => {
                          const { label, value, closable, onClose } = props
                          const member = allKnownMembers.find((m) => m.id === value)
                          const displayName =
                            member?.name ||
                            (typeof label === 'string' && label !== value ? label : undefined) ||
                            value
                          const isExt =
                            member?.affiliation === 'external' ||
                            member?.systemRole === 'EXTERNAL_USER'

                          return (
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium mr-1 my-0.5 border select-none',
                                isExt
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                  : 'bg-brand-blue/10 text-brand-blue border-brand-blue/30'
                              )}
                            >
                              <span>{displayName}</span>
                              {closable && (
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onClose(e as any)
                                  }}
                                  className="text-muted-foreground hover:text-foreground cursor-pointer ml-0.5 rounded p-0.5 inline-flex items-center"
                                >
                                  <X className="h-3 w-3" />
                                </span>
                              )}
                            </span>
                          )
                        }}
                        filterOption={(input, option) => {
                          if (!option) return false
                          const inputLower = input.toLowerCase()
                          const title = String(option.title ?? option.label ?? '').toLowerCase()
                          const role = String((option as any).role ?? '').toLowerCase()
                          const aff = String((option as any).affiliation ?? '').toLowerCase()
                          const sysRole = String((option as any).systemRole ?? '').toLowerCase()
                          const mgrName = String((option as any).managerName ?? '').toLowerCase()
                          return (
                            title.includes(inputLower) ||
                            role.includes(inputLower) ||
                            aff.includes(inputLower) ||
                            sysRole.includes(inputLower) ||
                            mgrName.includes(inputLower)
                          )
                        }}
                        optionRender={(option) => {
                          const optData = option.data
                          if (!optData) return null
                          const isExt =
                            optData.affiliation === 'external' ||
                            optData.systemRole === 'EXTERNAL_USER'
                          const isMgr = optData.systemRole === 'MANAGER'
                          return (
                            <div className="flex items-center justify-between gap-2 py-1 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white text-[10px] font-medium">
                                  {optData.label?.toString().charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-medium text-foreground block truncate">
                                    {optData.label}
                                  </span>
                                  {optData.managerName && (
                                    <span className="text-[10px] text-muted-foreground block truncate">
                                      Reports to: {optData.managerName}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={cn(
                                    'rounded px-1.5 py-0.5 text-[9px] font-medium uppercase border',
                                    isExt
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                      : isMgr
                                      ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                                      : 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20'
                                  )}
                                >
                                  {isExt ? 'External' : isMgr ? 'Manager' : 'Internal'}
                                </span>
                                {optData.role && (
                                  <span className="text-[11px] text-muted-foreground">
                                    {optData.role}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Selected Assignees List */}
                {selectedAssignees.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-[11px]">Assigned Members</span>
                      {Boolean(user) && (
                        <button
                          type="button"
                          disabled={isUpdatingAssignees}
                          onClick={() => handleAssigneesUpdate([])}
                          className="text-[11px] text-destructive hover:underline cursor-pointer disabled:opacity-50"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {selectedAssignees.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-lg border border-border/80 bg-background/60 p-2 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="h-6 w-6 rounded-full object-cover border border-border shrink-0"
                              />
                            ) : (
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white text-[11px] font-medium">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate text-xs leading-tight">
                                {member.name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                                <span className="text-muted-foreground">{member.role}</span>
                                <span className="text-muted-foreground/50">•</span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'px-1 py-0 text-[9px] font-medium leading-none',
                                    member.affiliation === 'internal'
                                      ? 'border-brand-blue/30 text-brand-blue bg-brand-blue/5'
                                      : 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5'
                                  )}
                                >
                                  {member.affiliation === 'internal' ? 'Internal' : 'External'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {Boolean(user) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleToggleAssignee(member.id)}
                              className="text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                              title={`Remove ${member.name}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border py-4 text-center text-xs text-muted-foreground bg-muted/10">
                    No team members assigned yet.
                  </div>
                )}

                {/* Redirect to User Management (Admins only) */}
                {isAdmin && (
                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin/users?create=true')}
                      className="w-full text-xs cursor-pointer border-dashed hover:border-brand-blue hover:text-brand-blue h-8"
                    >
                      + Add New Collaborator to Directory
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Image Lightbox Modal */}
        {previewImage && (
          <div
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in-0 duration-150 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-xl bg-card border border-border p-2 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 px-2 border-b border-border/50">
                <span className="text-xs font-medium text-foreground truncate max-w-md">
                  {previewImage.name}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-center p-2 max-h-[75vh] overflow-auto">
                <img
                  src={previewImage.url}
                  alt={previewImage.name}
                  className="max-h-[70vh] w-auto rounded object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
