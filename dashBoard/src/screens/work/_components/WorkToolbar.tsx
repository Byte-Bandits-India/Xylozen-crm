import { Search } from 'lucide-react'
import { Select } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { roleService } from '@/services/roleService'
import {
  WORK_PRIORITY_FILTER_OPTIONS,
  WORK_STATUS_FILTER_OPTIONS,
  WORK_AFFILIATION_FILTER_OPTIONS,
} from '@/data/options'
import type {
  Priority,
  WorkStatus,
  UserRole,
  UserAffiliation,
} from '@/types/work'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

type WorkToolbarProps = {
  currentBoard: 'status' | 'priority'
  searchQuery: string
  onSearchChange: (query: string) => void
  scopeFilter?: 'all' | 'assigned'
  onScopeChange?: (scope: 'all' | 'assigned') => void
  priorityFilter?: Priority | 'all'
  onPriorityChange?: (priority: Priority | 'all') => void
  statusFilter?: WorkStatus | 'all'
  onStatusChange?: (status: WorkStatus | 'all') => void
  roleFilter: UserRole | 'all'
  onRoleChange: (role: UserRole | 'all') => void
  affiliationFilter: UserAffiliation | 'all'
  onAffiliationChange: (affiliation: UserAffiliation | 'all') => void
}

export function WorkToolbar({
  currentBoard,
  searchQuery,
  onSearchChange,
  scopeFilter = 'all',
  onScopeChange,
  priorityFilter = 'all',
  onPriorityChange,
  statusFilter = 'all',
  onStatusChange,
  roleFilter,
  onRoleChange,
  affiliationFilter,
  onAffiliationChange,
}: WorkToolbarProps) {
  const navigate = useNavigate()
  const { isAdmin, isManager } = useAuth()

  const { data: functionalRoles = [] } = useQuery({
    queryKey: ['functional-roles'],
    queryFn: roleService.getFunctionalRoles,
  })

  const roleOptions = [
    { label: 'All Roles', value: 'all' },
    ...functionalRoles.map((r) => ({ label: r.name, value: r.name })),
  ]

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    priorityFilter !== 'all' ||
    statusFilter !== 'all' ||
    roleFilter !== 'all' ||
    affiliationFilter !== 'all'

  return (
    <div className="bg-card border-border mb-6 rounded-xl border p-3.5 shadow-xs">
      {/* Top row: Board Switcher, Scope Switcher, and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Board Switcher */}
          <div className="inline-flex items-center rounded-lg bg-muted p-1 text-xs">
            <button
              type="button"
              onClick={() => navigate('/work/status-board')}
              className={cn(
                'rounded-md px-3 py-1.5 font-medium transition-colors cursor-pointer',
                currentBoard === 'status'
                  ? 'bg-brand-blue !text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Status Board
            </button>
            <button
              type="button"
              onClick={() => navigate('/work/impact-board')}
              className={cn(
                'rounded-md px-3 py-1.5 font-medium transition-colors cursor-pointer',
                currentBoard === 'priority'
                  ? 'bg-brand-blue !text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Impact Board
            </button>
          </div>

          {/* Scope Switcher (Admins & Managers) */}
          {onScopeChange && (isAdmin || isManager) && (
            <div className="inline-flex items-center rounded-lg bg-muted p-1 text-xs">
              <button
                type="button"
                onClick={() => onScopeChange('all')}
                className={cn(
                  'rounded-md px-3 py-1.5 font-medium transition-colors cursor-pointer',
                  scopeFilter === 'all'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isManager && !isAdmin ? "My Team's Tasks" : 'All Tasks'}
              </button>
              <button
                type="button"
                onClick={() => onScopeChange('assigned')}
                className={cn(
                  'rounded-md px-3 py-1.5 font-medium transition-colors cursor-pointer',
                  scopeFilter === 'assigned'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Assigned to Me
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64 md:w-72">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border-input focus:border-brand-blue focus:ring-1 focus:ring-brand-blue h-8.5 w-full rounded-md border bg-background pl-8.5 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-colors"
          />
        </div>
      </div>

      {/* Filter Row */}
      <div className="mt-3 flex flex-wrap items-center gap-2.5 pt-3 border-t border-border">
        {currentBoard === 'status' && onPriorityChange && (
          <Select
            value={priorityFilter}
            onChange={onPriorityChange}
            options={WORK_PRIORITY_FILTER_OPTIONS}
            className="min-w-36"
            placeholder="Priority"
          />
        )}

        {currentBoard === 'priority' && onStatusChange && (
          <Select
            value={statusFilter}
            onChange={onStatusChange}
            options={WORK_STATUS_FILTER_OPTIONS}
            className="min-w-44"
            placeholder="Status"
          />
        )}

        <Select
          value={roleFilter}
          onChange={onRoleChange}
          options={roleOptions}
          className="min-w-36"
          placeholder="Role"
        />

        <Select
          value={affiliationFilter}
          onChange={onAffiliationChange}
          options={WORK_AFFILIATION_FILTER_OPTIONS}
          className="min-w-36"
          placeholder="Affiliation"
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('')
              onRoleChange('all')
              onAffiliationChange('all')
              if (onPriorityChange) onPriorityChange('all')
              if (onStatusChange) onStatusChange('all')
            }}
            className="ml-auto text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer underline-offset-4 hover:underline"
          >
            Reset filters
          </button>
        )}
      </div>
    </div>
  )
}
