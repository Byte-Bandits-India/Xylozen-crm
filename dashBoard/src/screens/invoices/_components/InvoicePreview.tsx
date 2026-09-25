import React, { useRef, useState } from 'react';
import { Download, Printer, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button, message, Tooltip } from 'antd';
import { A4Document } from './A4Document';
import type { InvoiceMetadata, LineItem, ClientData } from '../types';
import { generateInvoicePdf, printInvoiceDocument } from '../_utils/invoicePdfGenerator';
import { cn } from '@/lib/utils';

interface InvoicePreviewProps {
  metadata: InvoiceMetadata;
  documentHtml: string;
  items?: LineItem[];
  client?: ClientData;
  className?: string;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  metadata,
  documentHtml,
  items,
  client,
  className,
}) => {
  const [zoom, setZoom] = useState<number>(0.65); // default comfortable scaling for 40% column
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const documentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!documentRef.current) return;
    try {
      setIsExporting(true);
      message.loading({ content: 'Generating crisp 300 DPI PDF...', key: 'pdf-gen' });
      const clientSlug = client?.name ? client.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Client';
      const fileName = `${metadata.invoiceNumber || 'Invoice'}_${clientSlug}.pdf`;

      await generateInvoicePdf({
        element: documentRef.current,
        fileName,
      });

      message.success({ content: 'PDF downloaded successfully!', key: 'pdf-gen' });
    } catch (err: any) {
      console.error('PDF export error:', err);
      message.error({
        content: err?.message ? `Failed to generate PDF: ${err.message}` : 'Failed to generate PDF. Please try again.',
        key: 'pdf-gen',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs', className)}>
      {/* Top Floating Preview Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200 select-none">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-800">Preview</span>
          <span className="text-[11px] text-gray-400 font-normal">A4 Letterhead</span>
        </div>

        {/* Zoom & Action Controls */}
        <div className="flex items-center gap-1">
          <Tooltip title="Zoom Out">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
              className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Zoom In">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.2, z + 0.1))}
              className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          <Tooltip title="Reset Scale (Fit)">
            <button
              type="button"
              onClick={() => setZoom(0.65)}
              className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          <div className="h-3 w-px bg-gray-200 mx-1" />

          <Tooltip title="Print Document">
            <button
              type="button"
              onClick={() => printInvoiceDocument(documentRef.current)}
              className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          <Button
            type="primary"
            size="small"
            icon={<Download className="h-3.5 w-3.5" />}
            loading={isExporting}
            onClick={handleDownloadPdf}
            className="bg-blue-600 hover:bg-blue-500 text-xs ml-1 font-medium"
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Scrollable Canvas Container with Zoom Transform (scrollbar hidden) */}
      <div
        className="flex-1 overflow-auto p-4 md:p-6 flex justify-center items-start bg-slate-100/80 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
            marginBottom: `${(1123 * zoom) - 1123 + 40}px`,
          }}
        >
          <div ref={documentRef}>
            <A4Document
              metadata={metadata}
              documentHtml={documentHtml}
              items={items}
              client={client}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
