import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle, FileText } from 'lucide-react';
import { Button, message } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/apiClient';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { InvoiceMetadataForm } from './_components/InvoiceMetadataForm';
import { DocumentEditor } from './_components/DocumentEditor';
import { InvoicePreview } from './_components/InvoicePreview';
import type { InvoiceMetadata, LineItem, ClientData, TeamUser } from './types';
import {

  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_ESTIMATE_HTML,
  DEFAULT_WEBSITE,
  DEFAULT_ADDRESS,
  DEFAULT_MOBILE,
  DEFAULT_EMAIL,
  serializeDocument,
} from './_utils/documentSerializer';

const EMPTY_TEAM_USERS: TeamUser[] = [];
const EMPTY_CLIENTS: ClientData[] = [];

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  // Fetch clients
  const { data: clients = EMPTY_CLIENTS } = useQuery<ClientData[]>({
    queryKey: ['clients-invoices-select'],
    queryFn: async () => {
      const res = await apiClient.get('/clients?page=1&pageSize=100');
      return res.data.data || res.data || [];
    },
  });

  // Current user info
  const currentUserName =
    [user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    '';
  const currentUserSig = user?.publicId
    ? (user?.profile as any)?.signatureImage ||
      localStorage.getItem(`user_signature_${user.publicId}`) ||
      undefined
    : undefined;

  // Fetch next sequential Invoice ID from backend (order-wise starting from XY0001)
  const { data: nextIdData } = useQuery<{ nextNumber: string }>({
    queryKey: ['next-invoice-number'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/invoices/next-number');
        const d = res.data?.data || res.data;
        if (d && typeof d === 'object' && d.nextNumber) {
          return d;
        }
        if (typeof res.data?.message === 'object' && res.data.message?.nextNumber) {
          return res.data.message;
        }
        if (typeof d === 'string' && d.startsWith('XY')) {
          return { nextNumber: d };
        }
        return { nextNumber: 'XY0001' };
      } catch (err) {
        console.error('Failed to fetch next invoice number:', err);
        return { nextNumber: 'XY0001' };
      }
    },
    staleTime: 0,
    gcTime: 0,
  });

  // State: Metadata (strictly 8 inputs)
  const [metadata, setMetadata] = useState<InvoiceMetadata>(() => ({
    date: dayjs().toISOString(),
    invoiceNumber: '',
    website: DEFAULT_WEBSITE,
    address: DEFAULT_ADDRESS,
    mobile: DEFAULT_MOBILE,
    email: DEFAULT_EMAIL,
    signatoryUserPublicId: currentUserSig ? user?.publicId || '' : '',
    signatoryName: currentUserSig ? currentUserName : '',
    signatorySignatureImage: currentUserSig,
    createdByUserPublicId: user?.publicId || '',
    createdByName: currentUserName,
    title: DEFAULT_DOCUMENT_TITLE,
    currency: 'INR',
    status: 'PENDING',
  }));

  // Update defaults when user or teamUsers load
  useEffect(() => {
    if (user?.publicId) {
      const currentUserSig =
        (user?.profile as any)?.signatureImage ||
        (user?.publicId ? localStorage.getItem(`user_signature_${user.publicId}`) : undefined) ||
        undefined;

      // Prefer user with uploaded signature image
      const userWithSig = currentUserSig
        ? { publicId: user.publicId, name: currentUserName, signatureImage: currentUserSig }
        : teamUsers.find(
            (u) =>
              Boolean(u.signatureImage || (u.publicId ? localStorage.getItem(`user_signature_${u.publicId}`) : false))
          );

      const sigUserPublicId = userWithSig?.publicId || '';
      const sigUserName = userWithSig?.name || '';
      const sigUserImage =
        userWithSig?.signatureImage ||
        (userWithSig?.publicId
          ? localStorage.getItem(`user_signature_${userWithSig.publicId}`) || undefined
          : undefined);

      setMetadata((prev) => {
        const nextCreatedBy = prev.createdByUserPublicId || user.publicId;
        const nextCreatedByName = prev.createdByName || currentUserName;

        // Only retain signatory if it actually has an uploaded signature
        const prevHasSig =
          Boolean(prev.signatorySignatureImage) ||
          (prev.signatoryUserPublicId &&
            teamUsers.some(
              (u) =>
                u.publicId === prev.signatoryUserPublicId &&
                Boolean(u.signatureImage || localStorage.getItem(`user_signature_${u.publicId}`))
            ));

        const nextSigId = prevHasSig ? prev.signatoryUserPublicId : sigUserPublicId;
        const nextSigName = prevHasSig ? prev.signatoryName : sigUserName;
        const nextSigImg = prevHasSig ? prev.signatorySignatureImage : sigUserImage;

        if (
          prev.createdByUserPublicId === nextCreatedBy &&
          prev.createdByName === nextCreatedByName &&
          prev.signatoryUserPublicId === nextSigId &&
          prev.signatoryName === nextSigName &&
          prev.signatorySignatureImage === nextSigImg
        ) {
          return prev;
        }

        return {
          ...prev,
          createdByUserPublicId: nextCreatedBy,
          createdByName: nextCreatedByName,
          signatoryUserPublicId: nextSigId,
          signatoryName: nextSigName,
          signatorySignatureImage: nextSigImg,
        };
      });
    }
  }, [user?.publicId, currentUserName, teamUsers]);

  // Sync next sequential invoice number when loaded
  useEffect(() => {
    if (nextIdData?.nextNumber) {
      setMetadata((prev) => {
        if (prev.invoiceNumber === nextIdData.nextNumber) return prev;
        return {
          ...prev,
          invoiceNumber: nextIdData.nextNumber,
        };
      });
    }
  }, [nextIdData?.nextNumber]);

  // State: Rich Document Content (Tiptap HTML)
  const [documentHtml, setDocumentHtml] = useState<string>(DEFAULT_ESTIMATE_HTML);

  // State: Default Financial Line Items for Backend Compatibility
  const [items] = useState<LineItem[]>([
    {
      itemName: 'Next.js Responsive Website (5-7 Pages)',
      description: 'Design, development, mobile-first optimization & basic SEO setup',
      quantity: 1,
      unitPrice: 25000,
      taxPercent: 0,
      discount: 0,
      total: 25000,
    },
  ]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (statusOverride?: string | void) => {
      // Ensure at least one line item exists for backend validator
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
        invoiceNumber: metadata.invoiceNumber || nextIdData?.nextNumber || undefined,
        clientPublicId: clients[0]?.publicId || undefined,
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

      const res = await apiClient.post('/invoices', payload);
      return res.data;
    },
    onSuccess: () => {
      message.success('Invoice created successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['next-invoice-number'] });
      navigate('/invoices');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || err.message || 'Failed to create invoice');
    },
  });

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen w-full flex flex-col gap-6">
      {/* Top Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">
            Invoice #{metadata.invoiceNumber || nextIdData?.nextNumber || '...'}
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            type="primary"
            icon={<CheckCircle className="h-3.5 w-3.5" />}
            loading={createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold cursor-pointer"
          >
            Create &amp; Issue
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
