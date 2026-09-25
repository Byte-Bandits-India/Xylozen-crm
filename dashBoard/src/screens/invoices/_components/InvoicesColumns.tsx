import { Popconfirm, Tooltip } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  Eye,
  Edit,
  Trash2,
  Download,
  Calendar,
  PenTool,
} from 'lucide-react';
import dayjs from 'dayjs';
import type { InvoiceData } from '../types';
import { deserializeDocument } from '../_utils/documentSerializer';

interface GetInvoicesColumnsParams {
  canEdit: boolean;
  canDelete: boolean;
  onPreview: (invoice: InvoiceData) => void;
  onEdit: (invoice: InvoiceData) => void;
  onDelete: (publicId: string) => void;
  onDownloadPdf: (invoice: InvoiceData) => void;
}

export function getInvoicesColumns({
  canEdit,
  canDelete,
  onPreview,
  onEdit,
  onDelete,
  onDownloadPdf,
}: GetInvoicesColumnsParams): TableColumnsType<InvoiceData> {
  return [
    {
      title: 'Invoice ID',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 220,
      render: (_, record) => {
        const idText = record?.invoiceNumber || 'XY0000';
        return (
          <div className="inline-flex items-center">
            <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 shadow-2xs whitespace-nowrap tracking-wide select-all">
              {idText}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Date',
      dataIndex: 'issuedDate',
      key: 'issuedDate',
      width: 150,
      render: (_, record) => {
        const dateVal = record?.issuedDate || record?.createdAt;
        return (
          <div className="flex items-center gap-1.5 text-xs text-gray-700 whitespace-nowrap">
            <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="font-medium">
              {dateVal ? dayjs(dateVal).format('DD MMM YYYY') : '-'}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Created By',
      key: 'createdBy',
      render: (_, record) => {
        const doc = deserializeDocument(record?.description);
        const creatorName: string =
          [record?.createdBy?.profile?.firstName, record?.createdBy?.profile?.lastName]
            .filter(Boolean)
            .join(' ') ||
          record?.createdBy?.username ||
          (record as any)?.createdByName ||
          (doc as any)?.createdByName ||
          'Team Member';

        const initials =
          creatorName
            .split(' ')
            .filter(Boolean)
            .map((n: string) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'TM';

        return (
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center border border-blue-200 shrink-0">
              {initials}
            </div>
            <div className="flex flex-col text-xs leading-tight">
              <span className="font-semibold text-gray-900">{creatorName}</span>
              {record?.createdBy?.username && (
                <span className="text-gray-400 text-[11px]">@{record.createdBy.username}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Authorized Signatory',
      key: 'signatory',
      render: (_, record) => {
        const doc = deserializeDocument(record?.description);
        const sigName = doc?.signatory?.name || 'Hariharan C';

        return (
          <div className="flex items-center gap-2">
            <div className="flex flex-col text-xs">
              <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                <PenTool className="h-3 w-3 text-blue-600 shrink-0" />
                {sigName}
              </span>
              <span className="text-[11px] text-gray-400">Authorized Signatory</span>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <div className="flex items-center gap-1">
          <Tooltip title="View Preview">
            <button
              type="button"
              onClick={() => onPreview(record)}
              className="p-1.5 rounded hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <Eye className="h-4 w-4" />
            </button>
          </Tooltip>

          <Tooltip title="Download 300 DPI PDF">
            <button
              type="button"
              onClick={() => onDownloadPdf(record)}
              className="p-1.5 rounded hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
            </button>
          </Tooltip>

          {canEdit && (
            <Tooltip title="Edit Document">
              <button
                type="button"
                onClick={() => onEdit(record)}
                className="p-1.5 rounded hover:bg-amber-50 text-gray-600 hover:text-amber-600 transition-colors cursor-pointer"
              >
                <Edit className="h-4 w-4" />
              </button>
            </Tooltip>
          )}

          {canDelete && (
            <Popconfirm
              title="Delete Invoice"
              description="Are you sure you want to delete this invoice document?"
              onConfirm={() => onDelete(record.publicId)}
              okText="Yes, delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <button
                type="button"
                className="p-1.5 rounded hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];
}
