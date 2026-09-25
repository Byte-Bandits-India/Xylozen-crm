import { DatePicker, Input, Select } from 'antd';
import {
  Calendar,
  Shield,
  Globe,
  MapPin,
  Phone,
  Mail,
  PenTool,
  UserCheck,
} from 'lucide-react';
import dayjs from 'dayjs';
import type { InvoiceMetadata, TeamUser } from '../types';

interface InvoiceMetadataFormProps {
  metadata: InvoiceMetadata;
  onChangeMetadata: (updated: Partial<InvoiceMetadata>) => void;
  teamUsers: TeamUser[];
  isLoadingUsers?: boolean;
}

export const InvoiceMetadataForm = ({
  metadata,
  onChangeMetadata,
  teamUsers,
  isLoadingUsers = false,
}: InvoiceMetadataFormProps) => {
  // Handle signatory user selection: auto-load name and signature image
  const handleSelectSignatory = (userPublicId: string) => {
    const selectedUser = teamUsers.find((u) => u.publicId === userPublicId);
    if (!selectedUser) return;

    // Check if user has signature stored in profile or localStorage
    const savedSig =
      selectedUser.signatureImage ||
      localStorage.getItem(`user_signature_${userPublicId}`) ||
      undefined;

    onChangeMetadata({
      signatoryUserPublicId: userPublicId,
      signatoryName: selectedUser.name,
      signatorySignatureImage: savedSig,
    });
  };

  // Handle created by user selection
  const handleSelectCreatedBy = (userPublicId: string) => {
    const selectedUser = teamUsers.find((u) => u.publicId === userPublicId);
    onChangeMetadata({
      createdByUserPublicId: userPublicId,
      createdByName: selectedUser?.name || '',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
          Invoice Header &amp; Company Details
        </h3>
        <span className="text-[11px] text-gray-400">
          Values sync live with the A4 letterhead template
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Calendar Date (Single Date Picker) */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            Date
          </label>
          <DatePicker
            value={metadata.date ? dayjs(metadata.date) : dayjs()}
            onChange={(d) => onChangeMetadata({ date: d ? d.toISOString() : dayjs().toISOString() })}
            className="w-full"
            format="DD-MM-YYYY"
            allowClear={false}
          />
        </div>

        {/* 2. Invoice ID (Auto-generated order-wise starting from XY0001, Non-editable) */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              Invoice ID
            </span>
          </label>
          <Input
            value={metadata.invoiceNumber}
            readOnly
            placeholder="Generating ID..."
            className="font-mono text-sm uppercase bg-slate-50 text-slate-800 font-semibold cursor-not-allowed border-slate-200 select-all hover:border-slate-200 focus:border-slate-200 focus:shadow-none"
          />
        </div>

        {/* 3. Created By User */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
            Created By
          </label>
          <Select
            showSearch
            placeholder="Select User"
            loading={isLoadingUsers}
            value={metadata.createdByUserPublicId || undefined}
            onChange={handleSelectCreatedBy}
            optionFilterProp="label"
            className="w-full"
            options={teamUsers.map((u) => ({
              value: u.publicId,
              label: `${u.name}${u.email ? ` (${u.email})` : ''}`,
            }))}
          />
        </div>

        {/* 4. Signatory Name (Users Dropdown with Signature link) */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <PenTool className="h-3.5 w-3.5 text-blue-600" />
              Signatory Name
            </span>
          </label>
          <Select
            showSearch
            placeholder="Select Signatory User"
            loading={isLoadingUsers}
            value={metadata.signatoryUserPublicId || undefined}
            onChange={handleSelectSignatory}
            optionFilterProp="label"
            className="w-full"
            options={teamUsers.map((u) => ({
              value: u.publicId,
              label: u.name,
            }))}
          />
        </div>

        {/* 5. Website Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-blue-600" />
            Website Name
          </label>
          <Input
            value={metadata.website}
            onChange={(e) => onChangeMetadata({ website: e.target.value })}
            placeholder="https://xylozentech.com/"
          />
        </div>

        {/* 6. Address */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            Address
          </label>
          <Input
            value={metadata.address}
            onChange={(e) => onChangeMetadata({ address: e.target.value })}
            placeholder="Anjali by Vikaan shelters..."
          />
        </div>

        {/* 7. Mobile */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-blue-600" />
            Mobile
          </label>
          <Input
            value={metadata.mobile}
            onChange={(e) => onChangeMetadata({ mobile: e.target.value })}
            placeholder="+91 95512 82002"
          />
        </div>

        {/* 8. Email */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-blue-600" />
            Email
          </label>
          <Input
            value={metadata.email}
            onChange={(e) => onChangeMetadata({ email: e.target.value })}
            placeholder="support@xylozentech.com"
          />
        </div>
      </div>
    </div>
  );
};
