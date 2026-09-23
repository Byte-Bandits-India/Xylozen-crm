import React from 'react'
import { Input, Select, Button } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'

export interface TableFilterOption {
  value: string | number
  label: React.ReactNode
  disabled?: boolean
}

export interface TableFilterItem {
  key: string
  label?: string
  placeholder?: string
  value?: any
  onChange: (value: any) => void
  options: TableFilterOption[]
  width?: number | string
  allowClear?: boolean
  disabled?: boolean
}

export interface TableFilterToolbarProps {
  layout?: 'vertical' | 'horizontal'
  title?: React.ReactNode
  description?: React.ReactNode

  // Search Configuration
  showSearch?: boolean
  searchLabel?: string
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  onSearch?: (value: string) => void
  searchWidth?: number | string

  // Filters Configuration
  filters?: TableFilterItem[]

  // Reset Configuration
  onReset?: () => void
  hasActiveFilters?: boolean
  resetButtonText?: string

  // Extra Actions
  extraActions?: React.ReactNode

  className?: string
  style?: React.CSSProperties
}

export const TableFilterToolbar: React.FC<TableFilterToolbarProps> = ({
  layout = 'vertical',
  title,
  description,

  showSearch = true,
  searchLabel = 'Search',
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  onSearch,
  searchWidth,

  filters = [],

  onReset,
  hasActiveFilters = false,
  resetButtonText = 'Reset Filters',

  extraActions,
  className = '',
  style,
}) => {
  const isVertical = layout === 'vertical'

  const handleSearchSubmit = () => {
    if (onSearch) {
      onSearch(searchValue)
    }
  }

  const renderSearch = () => {
    if (!showSearch) return null

    const inputComponent = (
      <Input
        style={{ width: searchWidth || (isVertical ? 280 : 260) }}
        placeholder={searchPlaceholder}
        prefix={<SearchOutlined className="text-gray-400" />}
        value={searchValue}
        onChange={(e) => onSearchChange?.(e.target.value)}
        onPressEnter={handleSearchSubmit}
        allowClear
      />
    )

    if (isVertical) {
      return (
        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
          {searchLabel && (
            <span className="text-xs font-medium text-gray-700">{searchLabel}</span>
          )}
          {inputComponent}
        </div>
      )
    }

    return inputComponent
  }

  const renderFilters = () => {
    return filters.map((filter) => {
      const selectComponent = (
        <Select
          value={filter.value}
          onChange={filter.onChange}
          style={{ width: filter.width || 160 }}
          options={filter.options}
          placeholder={filter.placeholder}
          allowClear={filter.allowClear}
          disabled={filter.disabled}
        />
      )

      if (isVertical) {
        return (
          <div key={filter.key} className="flex flex-col gap-1.5">
            {filter.label && (
              <span className="text-xs font-medium text-gray-700">{filter.label}</span>
            )}
            {selectComponent}
          </div>
        )
      }

      return <React.Fragment key={filter.key}>{selectComponent}</React.Fragment>
    })
  }

  const renderResetButton = () => {
    if (!hasActiveFilters || !onReset) return null

    return (
      <Button
        type="text"
        icon={<ReloadOutlined className="text-xs" />}
        onClick={onReset}
        className={`text-xs text-gray-500 hover:text-gray-700 ${
          isVertical ? 'self-end sm:self-auto mb-0.5' : ''
        }`}
      >
        {resetButtonText}
      </Button>
    )
  }

  return (
    <div
      style={style}
      className={`bg-gray-50/70 p-3.5 rounded-lg border border-gray-200/60 mb-4 flex flex-col gap-3 ${className}`}
    >
      {/* Optional Header Row for Title and Extra Actions */}
      {(title || description || extraActions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-gray-200/50">
          <div>
            {title && (
              typeof title === 'string' ? (
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              ) : (
                title
              )
            )}
            {description && (
              typeof description === 'string' ? (
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              ) : (
                description
              )
            )}
          </div>
          {extraActions && (
            <div className="flex items-center gap-2">{extraActions}</div>
          )}
        </div>
      )}

      {/* Main Controls Area */}
      {isVertical ? (
        <div className="flex flex-wrap items-end gap-3 w-full">
          {renderSearch()}
          <div className="flex flex-wrap items-end gap-3">
            {renderFilters()}
            {renderResetButton()}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {renderSearch()}
            {renderFilters()}
            {renderResetButton()}
          </div>
          {extraActions && !title && (
            <div className="flex items-center gap-2">{extraActions}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default TableFilterToolbar
