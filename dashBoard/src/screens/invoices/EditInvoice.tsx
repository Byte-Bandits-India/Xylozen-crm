import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle, FileText, Loader2 } from 'lucide-react';
import { Button, message, Spin } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/apiClient';
import { queryClient } from '@/lib/queryClient';
import { InvoiceMetadataForm } from './_components/InvoiceMetadataForm';
import { DocumentEditor } from './_components/DocumentEditor';
import { InvoicePreview } from './_components/InvoicePreview';
import type { InvoiceMetadata, LineItem, InvoiceData, TeamUser } from './types';
import {
  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_ESTIMATE_HTML,
  DEFAULT_SIGNATORY_NAME,
  DEFAULT_WEBSITE,
  DEFAULT_ADDRESS,
  DEFAULT_MOBILE,
  DEFAULT_EMAIL,
  deserializeDocument,
  serializeDocument,
} from './_utils/documentSerializer';

const EMPTY_TEAM_USERS: TeamUser[] = [];

export default function EditInvoice() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isHydratedRef = useRef(false);

  // Reset hydration flag if invoice id changes
  useEffect(() => {
    isHydratedRef.current = false;
  }, [id]);

  // Fetch team users for Signatory and Created By dropdowns
  const { data: teamUsers = EMPTY_TEAM_USERS, isLoading: isLoadingUsers } = useQuery<TeamUser[]>({
    queryKey: ['team-users-invoices'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/users?page=1&pageSize=100');
        const raw = res.data?.data || res.data || [];
        return (Array.isArray(raw) ? raw : []).map((u: any) => {
          const fullName =
            [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ') ||
            u.username ||
            'Team Member';
          const sig =
            u.profile?.signatureImage ||
            localStorage.getItem(`user_signature_${u.publicId}`) ||
            undefined;
          return {
            publicId: u.publicId,
            name: fullName,
            email: u.email,
            username: u.username,
            signatureImage: sig,
          };
        });
      } catch {
        return [];
      }
    },
  });

  // State: Metadata (strictly 8 inputs)
  const [metadata, setMetadata] = useState<InvoiceMetadata>(() => ({
    date: dayjs().toISOString(),
    invoiceNumber: '',
    website: DEFAULT_WEBSITE,
    address: DEFAULT_ADDRESS,
    mobile: DEFAULT_MOBILE,
    email: DEFAULT_EMAIL,
    signatoryUserPublicId: '',
    signatoryName: DEFAULT_SIGNATORY_NAME,
    signatorySignatureImage: undefined,
    createdByUserPublicId: '',
    createdByName: '',
    title: DEFAULT_DOCUMENT_TITLE,
    currency: 'INR',
    status: 'PENDING',
  }));

  // State: Rich Document Content (Tiptap HTML)
  const [documentHtml, setDocumentHtml] = useState<string>(DEFAULT_ESTIMATE_HTML);

  // State: Financial Line Items
  const [items, setItems] = useState<LineItem[]>([]);

  // Fetch Existing Invoice
  const { data: invoice, isLoading: isLoadingInvoice } = useQuery<InvoiceData>({
    queryKey: ['invoice-detail', id],
    queryFn: async () => {
      const res = await apiClient.get(`/invoices/${id}`);
      return res.data.data || res.data;
    },
    enabled: !!id,
  });

  // Hydrate Form State when Invoice data loads (once per invoice)
  useEffect(() => {
    if (!invoice || isHydratedRef.current) return;
    isHydratedRef.current = true;

    const parsedDoc = deserializeDocument(invoice.description);
    const creatorName =
      invoice.createdBy?.profile?.firstName
        ? `${invoice.createdBy.profile.firstName} ${invoice.createdBy.profile.lastName || ''}`.trim()
        : invoice.createdBy?.username || '';

    // Check if signatory has signature in profile or localStorage
    const sigUser = teamUsers.find(
      (u) =>
        u.publicId === parsedDoc.signatory?.userPublicId ||
        u.name === parsedDoc.signatory?.name
    );
    const resolvedSig =
      parsedDoc.signatory?.signatureImage ||
      sigUser?.signatureImage ||
      (sigUser?.publicId
        ? localStorage.getItem(`user_signature_${sigUser.publicId}`) || undefined
        : undefined);

    setMetadata({
      date: invoice.issuedDate || dayjs().toISOString(),
      invoiceNumber: invoice.invoiceNumber,
      website: parsedDoc.companyDetails?.website || DEFAULT_WEBSITE,
      address: parsedDoc.companyDetails?.address || DEFAULT_ADDRESS,
      mobile: parsedDoc.companyDetails?.mobile || DEFAULT_MOBILE,
      email: parsedDoc.companyDetails?.email || DEFAULT_EMAIL,
      signatoryUserPublicId: parsedDoc.signatory?.userPublicId || sigUser?.publicId || '',
      signatoryName: parsedDoc.signatory?.name || DEFAULT_SIGNATORY_NAME,
      signatorySignatureImage: resolvedSig,
      createdByUserPublicId:
        invoice.createdByPublicId || parsedDoc.createdByUserPublicId || '',
      createdByName: creatorName,
      title: invoice.title || parsedDoc.documentTitle || DEFAULT_DOCUMENT_TITLE,
      clientPublicId: invoice.clientPublicId || '',
      currency: invoice.currency || 'INR',
      status: invoice.status || 'PENDING',
    });

    setDocumentHtml(parsedDoc.documentHtml || DEFAULT_ESTIMATE_HTML);

    if (invoice.items && invoice.items.length > 0) {
      setItems(
        invoice.items.map((it) => ({
          id: it.id,
          itemName: it.itemName,
          description: it.description || '',
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          taxPercent: Number(it.taxPercent) || 0,
          discount: Number(it.discount) || 0,
          total: Number(it.total) || 0,
        }))
      );
    }
  }, [invoice, teamUsers]);

  // If signatory signature wasn't in document but user loaded in teamUsers, hydrate signature
  useEffect(() => {
    if (!teamUsers.length) return;
    setMetadata((prev) => {
      if (prev.signatorySignatureImage) return prev;
      const sigUser = teamUsers.find(
        (u) =>
          u.publicId === prev.signatoryUserPublicId ||
          u.name === prev.signatoryName
      );
      const sigImg =
        sigUser?.signatureImage ||
        (sigUser?.publicId
          ? localStorage.getItem(`user_signature_${sigUser.publicId}`) || undefined
          : undefined);
      if (!sigImg || prev.signatorySignatureImage === sigImg) return prev;
      return { ...prev, signatorySignatureImage: sigImg };
    });
  }, [teamUsers]);

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (statusOverride?: string | void) => {
      if (!id) throw new Error('Missing invoice identifier');

      // Ensure valid line items for backend calculation
      const validItems =
        items.length > 0 && items.some((it) => it.itemName.trim())
          ? items.filter((it) => it.itemName.trim())
          : [
              {
                itemName: metadata.title || 'Professional Services',
                description: 'Deliverables as per Scope of Work',
                quantity: 1,
                unitPrice: 0,
                taxPercent: 0,
                discount: 0,
                total: 0,
              },
            ];

      const serializedDoc = serializeDocument({
        documentFormat: 'tiptap-v2',
        documentTitle: metadata.title || DEFAULT_DOCUMENT_TITLE,
        documentHtml,
        companyDetails: {
          website: metadata.website,
          address: metadata.address,
          mobile: metadata.mobile,
          email: metadata.email,
        },
        signatory: {
          userPublicId: metadata.signatoryUserPublicId,
          name: metadata.signatoryName,
          title: 'Authorized Signatory',
          signatureImage: metadata.signatorySignatureImage,
        },
        createdByUserPublicId: metadata.createdByUserPublicId,
      });

      const payload = {
        title: metadata.title || DEFAULT_DOCUMENT_TITLE,
        issuedDate: metadata.date,
        dueDate: metadata.date,
        currency: metadata.currency || 'INR',
        status: statusOverride || metadata.status || 'PENDING',
        description: serializedDoc,
        items: validItems.map((it) => ({
          itemName: it.itemName,
          description: it.description || undefined,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          taxPercent: it.taxPercent || 0,
          discount: it.discount || 0,
        })),
      };

      const res = await apiClient.put(`/invoices/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      message.success('Invoice updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', id] });
      navigate('/invoices');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || err.message || 'Failed to update invoice');
    },
  });

  if (isLoadingInvoice) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Spin indicator={<Loader2 className="h-8 w-8 animate-spin text-blue-600" />} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen w-full flex flex-col gap-6">
      {/* Top Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">
            Invoice #{metadata.invoiceNumber}
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            type="primary"
            icon={<CheckCircle className="h-3.5 w-3.5" />}
            loading={updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
            className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold cursor-pointer"
          >
            Update Invoice
          </Button>
        </div>
      </div>

      {/* Main Two-Column Document Builder Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column (~58%): Builder & Document Editor */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          {/* Metadata Section with strictly 8 inputs */}
          <InvoiceMetadataForm
            metadata={metadata}
            onChangeMetadata={(updated) => setMetadata((prev) => ({ ...prev, ...updated }))}
            teamUsers={teamUsers}
            isLoadingUsers={isLoadingUsers}
          />

          {/* Word-Style Document Editor */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                Document Body &amp; Custom Tables
              </span>
              <span className="text-[11px] text-gray-400">
                Type directly or paste formatted tables
              </span>
            </div>
            <DocumentEditor
              contentHtml={documentHtml}
              onChangeHtml={(html) => setDocumentHtml(html)}
            />
          </div>
        </div>

        {/* Right Column (~42%): Sticky Live A4 Preview Canvas */}
        <div className="xl:col-span-5 sticky top-4 h-[calc(100vh-6rem)]">
          <InvoicePreview
            metadata={metadata}
            documentHtml={documentHtml}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
