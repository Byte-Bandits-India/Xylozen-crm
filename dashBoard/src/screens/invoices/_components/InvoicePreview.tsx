import React, { useRef, useState, useMemo } from 'react';
import { Download, Printer, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button, message, Tooltip } from 'antd';
import { A4Document } from './A4Document';
import type { InvoiceMetadata, LineItem, ClientData } from '../types';
import { generateInvoicePdf, printInvoiceDocument } from '../_utils/invoicePdfGenerator';
import { autoPaginateHtml } from '../_utils/contentPaginator';
import { cn } from '@/lib/utils';

interface InvoicePreviewProps {
  metadata: InvoiceMetadata;
  documentHtml?: string;
  pages?: string[];
  activePageIndex?: number;
  onSelectPage?: (index: number) => void;
  items?: LineItem[];
  client?: ClientData;
  className?: string;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  metadata,
  documentHtml,
  pages,
  activePageIndex,
  onSelectPage,
  items,
  client,
  className,
}) => {
  const [zoom, setZoom] = useState<number>(0.65); // default comfortable scaling for 40% column
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const documentRef = useRef<HTMLDivElement>(null);

  const effectivePages = useMemo(() => {
    const raw = pages && pages.length > 0 ? pages : [documentHtml || ''];
    return autoPaginateHtml(raw);
  }, [pages, documentHtml]);

  const totalPages = effectivePages.length;
  const totalCanvasHeight = totalPages * 1123 + (totalPages - 1) * 32 + totalPages * 28;

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
          <span className="text-[11px] text-gray-400 font-normal">
            A4 Letterhead ({totalPages} {totalPages === 1 ? 'Page' : 'Pages'})
          </span>
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
            marginBottom: `${(totalCanvasHeight * zoom) - totalCanvasHeight + 40}px`,
          }}
        >
          <div ref={documentRef} className="flex flex-col gap-8 pb-8">
            {effectivePages.map((pageHtml, index) => {
              const isSelected = activePageIndex === index;
              return (
                <div key={index} className="flex flex-col items-center">
                  {/* Page Indicator Tag above sheet */}
                  <div className="w-[794px] flex items-center justify-between pb-1.5 px-1 select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-gray-700 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded shadow-2xs border border-gray-200">
                        Page {index + 1} of {totalPages}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          Active in Editor
                        </span>
                      )}
                    </div>
                    {onSelectPage && (
                      <button
                        type="button"
                        onClick={() => onSelectPage(index)}
                        className={cn(
                          'text-[11px] px-2 py-0.5 rounded cursor-pointer transition-colors',
                          isSelected
                            ? 'text-blue-700 font-semibold'
                            : 'text-gray-500 hover:text-gray-900 bg-white/80 hover:bg-white border border-gray-200'
                        )}
                      >
                        {isSelected ? '● Editing' : 'Click to Edit Page'}
                      </button>
                    )}
                  </div>

                  <A4Document
                    metadata={metadata}
                    documentHtml={pageHtml}
                    pageNumber={index + 1}
                    totalPages={totalPages}
                    showSignatory={index === totalPages - 1}
                    items={items}
                    client={client}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
