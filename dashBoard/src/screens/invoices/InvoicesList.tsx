import { useState, useMemo, useRef } from 'react';
import { Table, Button, Input, Modal, message, Alert } from 'antd';
import { Plus, Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { TableLayout } from '@/components/layout/TableLayout';
import { getInvoicesColumns } from './_components/InvoicesColumns';
import { InvoicePreview } from './_components/InvoicePreview';
import { A4Document } from './_components/A4Document';
import type { InvoiceData, InvoiceMetadata } from './types';
import {
  deserializeDocument,
  DEFAULT_WEBSITE,
  DEFAULT_ADDRESS,
  DEFAULT_MOBILE,
  DEFAULT_EMAIL,
} from './_utils/documentSerializer';
import { generateInvoicePdf } from './_utils/invoicePdfGenerator';

export default function InvoicesList() {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin } = useAuth();
  // Allow all active team members to create and edit invoices, admins can delete
  const canEdit = true;
  const canDelete = isSuperAdmin || isAdmin;

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Preview modal state
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceData | null>(null);

  // Hidden print element for direct list downloads
  const [downloadingInvoice, setDownloadingInvoice] = useState<InvoiceData | null>(null);
  const hiddenDownloadRef = useRef<HTMLDivElement>(null);

  // Query Invoices
  const {
    data: invoices = [],
    isLoading,
    refetch,
    isError,
    error,
  } = useQuery<InvoiceData[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/invoices?page=1&pageSize=100');
        const raw = res.data?.data || res.data || [];
        if (Array.isArray(raw)) return raw;
        if (raw && Array.isArray((raw as any).invoices)) return (raw as any).invoices;
        if (raw && Array.isArray((raw as any).items)) return (raw as any).items;
        return [];
      } catch (err: any) {
        console.error('Failed to fetch invoices:', err);
        throw err;
      }
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (publicId: string) => {
      await apiClient.delete(`/invoices/${publicId}`);
    },
    onSuccess: () => {
      message.success('Invoice deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      refetch();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Failed to delete invoice');
    },
  });

  // Direct PDF Download from List
  const handleDirectDownload = async (record: InvoiceData) => {
    try {
      message.loading({ content: `Generating PDF for ${record.invoiceNumber}...`, key: 'list-pdf' });
      setDownloadingInvoice(record);

      // Wait a tick for hidden DOM to render
      setTimeout(async () => {
        if (!hiddenDownloadRef.current) {
          message.error({ content: 'Failed to locate document for export', key: 'list-pdf' });
          setDownloadingInvoice(null);
          return;
        }

        const fileName = `${record.invoiceNumber || 'Invoice'}.pdf`;

        await generateInvoicePdf({
          element: hiddenDownloadRef.current,
          fileName,
        });

        message.success({ content: 'PDF downloaded successfully!', key: 'list-pdf' });
        setDownloadingInvoice(null);
      }, 250);
    } catch (err: any) {
      console.error('Download error:', err);
      message.error({ content: err?.message ? `Failed to download PDF: ${err.message}` : 'Failed to download PDF', key: 'list-pdf' });
      setDownloadingInvoice(null);
    }
  };

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    if (!Array.isArray(invoices)) return [];
    return invoices.filter((inv) => {
      if (!inv) return false;
      const doc = deserializeDocument(inv.description);
      const creatorName =
        [inv.createdBy?.profile?.firstName, inv.createdBy?.profile?.lastName].filter(Boolean).join(' ') ||
        inv.createdBy?.username ||
        '';
      const signatoryName = doc?.signatory?.name || '';
      const website = doc?.companyDetails?.website || '';
      const invNum = inv.invoiceNumber || '';

      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;

      return (
        invNum.toLowerCase().includes(term) ||
        creatorName.toLowerCase().includes(term) ||
        signatoryName.toLowerCase().includes(term) ||
        website.toLowerCase().includes(term)
      );
    });
  }, [invoices, searchTerm]);

  const columns = getInvoicesColumns({
    canEdit,
    canDelete,
    onPreview: (inv) => setPreviewInvoice(inv),
    onEdit: (inv) => navigate(`/invoices/edit/${inv.publicId}`),
    onDelete: (publicId) => deleteMutation.mutate(publicId),
    onDownloadPdf: (inv) => handleDirectDownload(inv),
  });

  // Prepare metadata for modal preview
  const previewDocData = useMemo(() => {
    if (!previewInvoice) return null;
    const doc = deserializeDocument(previewInvoice.description);

    const metadata: InvoiceMetadata = {
      date: previewInvoice.issuedDate,
      invoiceNumber: previewInvoice.invoiceNumber,
      website: doc.companyDetails?.website || DEFAULT_WEBSITE,
      address: doc.companyDetails?.address || DEFAULT_ADDRESS,
      mobile: doc.companyDetails?.mobile || DEFAULT_MOBILE,
      email: doc.companyDetails?.email || DEFAULT_EMAIL,
      signatoryUserPublicId: doc.signatory?.userPublicId || '',
      signatoryName: doc.signatory?.name || 'Hariharan C',
      signatorySignatureImage: doc.signatory?.signatureImage,
      createdByUserPublicId: previewInvoice.createdByPublicId || doc.createdByUserPublicId || '',
      title: previewInvoice.title || doc.documentTitle || '',
      clientPublicId: '',
      currency: (previewInvoice.currency as any) || 'INR',
      status: previewInvoice.status as any,
    };

    return { metadata, documentHtml: doc.documentHtml };
  }, [previewInvoice]);

  // Prepare metadata for direct list download
  const downloadDocData = useMemo(() => {
    if (!downloadingInvoice) return null;
    const doc = deserializeDocument(downloadingInvoice.description);

    const metadata: InvoiceMetadata = {
      date: downloadingInvoice.issuedDate,
      invoiceNumber: downloadingInvoice.invoiceNumber,
      website: doc.companyDetails?.website || DEFAULT_WEBSITE,
      address: doc.companyDetails?.address || DEFAULT_ADDRESS,
      mobile: doc.companyDetails?.mobile || DEFAULT_MOBILE,
      email: doc.companyDetails?.email || DEFAULT_EMAIL,
      signatoryUserPublicId: doc.signatory?.userPublicId || '',
      signatoryName: doc.signatory?.name || 'Hariharan C',
      signatorySignatureImage: doc.signatory?.signatureImage,
      createdByUserPublicId: downloadingInvoice.createdByPublicId || doc.createdByUserPublicId || '',
      title: downloadingInvoice.title || doc.documentTitle || '',
      clientPublicId: '',
      currency: (downloadingInvoice.currency as any) || 'INR',
      status: downloadingInvoice.status as any,
    };

    return { metadata, documentHtml: doc.documentHtml };
  }, [downloadingInvoice]);

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen w-full flex flex-col gap-6">

      {/* Error alert if fetch failed */}
      {isError && (
        <Alert
          message="Failed to load invoices"
          description={(error as any)?.response?.data?.message || (error as any)?.message || 'Could not connect to invoices service.'}
          type="error"
          showIcon
          action={
            <Button size="small" type="primary" danger onClick={() => refetch()}>
              Retry
            </Button>
          }
          className="rounded-xl shadow-2xs"
        />
      )}

      {/* Main Table Layout */}
      <TableLayout
        title="Invoices & Quotations"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['next-invoice-number'] });
                navigate('/invoices/create');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold cursor-pointer"
            >
              Create Invoice
            </Button>
          </div>
        }
      >
        {/* Filter Bar */}
        <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 w-full sm:w-auto max-w-md">
            <Input
              prefix={<Search className="h-3.5 w-3.5 text-gray-400" />}
              placeholder="Search by Invoice ID, creator, or signatory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              className="text-xs"
            />
          </div>
        </div>

        {/* Invoices Data Table */}
        <Table
          dataSource={filteredInvoices}
          columns={columns}
          rowKey={(record) => record.publicId || String(record.id || record.invoiceNumber || Math.random())}
          loading={isLoading}
          locale={{
            emptyText: (
              <div className="py-14 flex flex-col items-center justify-center text-gray-400">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
                  <FileText className="h-8 w-8" />
                </div>
                <h4 className="text-sm font-semibold text-gray-800">No invoices or estimates yet</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-sm text-center">
                  {searchTerm
                    ? 'No documents match your search criteria. Try a different search keyword.'
                    : 'Create your first professional invoice with our Word-style editor and 300 DPI PDF letterhead.'}
                </p>
                {!searchTerm && (
                  <Button
                    type="primary"
                    icon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => navigate('/invoices/create')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-xs font-medium cursor-pointer"
                  >
                    Create First Invoice
                  </Button>
                )}
              </div>
            ),
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} documents`,
          }}
          scroll={{ x: 'max-content' }}
          className="overflow-x-auto"
        />
      </TableLayout>

      {/* Full Preview Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">Document Preview</span>
            <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              {previewInvoice?.invoiceNumber}
            </span>
          </div>
        }
        open={!!previewInvoice}
        onCancel={() => setPreviewInvoice(null)}
        footer={null}
        width={920}
        destroyOnClose
      >
        {previewDocData && (
          <div className="h-[75vh] mt-3">
            <InvoicePreview
              metadata={previewDocData.metadata}
              documentHtml={previewDocData.documentHtml}
              className="h-full"
            />
          </div>
        )}
      </Modal>

      {/* Hidden container for direct list-to-PDF downloads */}
      {downloadDocData && (
        <div style={{ position: 'fixed', left: '-9999px', top: '0', zIndex: -100 }}>
          <div ref={hiddenDownloadRef}>
            <A4Document
              metadata={downloadDocData.metadata}
              documentHtml={downloadDocData.documentHtml}
            />
          </div>
        </div>
      )}
    </div>
  );
}
