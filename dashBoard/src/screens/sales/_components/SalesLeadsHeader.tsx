import React from 'react'
import { Button } from 'antd'
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons'

export interface SalesLeadsHeaderProps {
  onExportCSV: () => void
  onAddNewRow: () => void
  isAddingRow: boolean
}

export const SalesLeadsHeader: React.FC<SalesLeadsHeaderProps> = ({
  onExportCSV,
  onAddNewRow,
  isAddingRow,
}) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-xl font-semibold text-slate-800 m-0 leading-none">
        Sales Leads
      </h1>
      <div className="flex items-center gap-2">
        <Button
          icon={<DownloadOutlined />}
          onClick={onExportCSV}
          size="middle"
        >
          Export
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAddNewRow}
          disabled={isAddingRow}
          size="middle"
          className="bg-blue-600 hover:bg-blue-500"
        >
          Add Lead
        </Button>
      </div>
    </div>
  )
}
