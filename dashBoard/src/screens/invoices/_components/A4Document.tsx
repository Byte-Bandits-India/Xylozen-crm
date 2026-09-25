import React from 'react';
import dayjs from 'dayjs';
import type { InvoiceMetadata, LineItem, ClientData } from '../types';

interface A4DocumentProps {
  metadata: InvoiceMetadata;
  documentHtml: string;
  items?: LineItem[];
  client?: ClientData;
  scale?: number;
}

export const A4Document: React.FC<A4DocumentProps> = ({
  metadata,
  documentHtml,
}) => {
  const formattedDate = metadata.date
    ? dayjs(metadata.date).format('DD-MM-YYYY')
    : dayjs().format('DD-MM-YYYY');

  return (
    <div
      className="a4-page-sheet relative bg-white text-gray-900 select-text overflow-hidden shadow-lg border border-gray-200/80 mx-auto"
      style={{
        width: '794px',
        minHeight: '1123px',
        color: '#111827',
        backgroundColor: '#ffffff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* High-Resolution Letterhead Background Template */}
      <img
        src="/Invoice-backgroundTemplate.png"
        alt="Letterhead Template"
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
      />

      {/* Top Header Overlay: Date & Invoice ID */}
      <div className="relative z-10 pt-8 pr-14 text-right">
        <div className="inline-block text-left text-[12.5px] font-sans leading-snug">
          <p className="text-gray-900">
            <span className="font-semibold">Date:</span>{' '}
            <span className="font-normal text-gray-800">{formattedDate}</span>
          </p>
          <p className="text-gray-900 mt-1">
            <span className="font-semibold">Invoice Id:</span>{' '}
            <span className="font-normal text-gray-800">{metadata.invoiceNumber || 'XY0001'}</span>
          </p>
        </div>
      </div>

      {/* Main Document Body Container - pt-16 provides clear whitespace below top graphic banner */}
      <div className="relative z-10 px-14 pt-16 pb-36">
        {/* Dynamic HTML Document Body (Overview, Scope of Work, Deliverables, Custom Document Tables) */}
        <div
          className="invoice-doc-body prose prose-sm max-w-none text-gray-850 leading-relaxed
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-950 [&_h1]:text-center [&_h1]:mb-6
            [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-950 [&_h2]:mt-6 [&_h2]:mb-2
            [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-1.5
            [&_p]:text-[13px] [&_p]:leading-[1.65] [&_p]:text-gray-800 [&_p]:mb-3
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:text-[13px]
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:text-[13px]
            [&_table]:w-full [&_table]:table-fixed [&_table]:border-collapse [&_table]:my-5 [&_table]:border [&_table]:border-gray-900
            [&_th]:bg-[#dce8fd] [&_th]:border [&_th]:border-gray-900 [&_th]:p-2.5 [&_th]:text-[12.5px] [&_th]:font-bold [&_th]:text-gray-900 [&_th]:text-left
            [&_td]:border [&_td]:border-gray-900 [&_td]:p-2.5 [&_td]:text-[12.5px] [&_td]:text-gray-800 [&_td]:align-top"
          dangerouslySetInnerHTML={{ __html: documentHtml }}
        />

        {/* Authorized Signatory Block (With uploaded signature image or cursive fallback) */}
        <div className="mt-12 flex justify-end">
          <div className="text-center min-w-40">
            <div className="h-12 flex items-center justify-center min-w-36">
              {metadata.signatorySignatureImage ? (
                <img
                  src={metadata.signatorySignatureImage}
                  alt={metadata.signatoryName || 'Signature'}
                  crossOrigin="anonymous"
                  className="max-h-12 max-w-44 object-contain"
                />
              ) : metadata.signatoryName ? (
                <span
                  style={{ fontFamily: "'Brush Script MT', 'Dancing Script', cursive" }}
                  className="text-2xl text-blue-900 tracking-wider font-medium"
                >
                  {metadata.signatoryName}
                </span>
              ) : null}
            </div>
            <p className="font-bold text-[13px] text-gray-900 mt-1">
              Authorized Signatory
            </p>
          </div>
        </div>
      </div>

      {/* Footer Contact Details Overlay: Dynamically bound to the 4 footer inputs */}
      <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none select-text z-10">
        {/* Left Footer Info (Website) - aligned directly with Globe icon */}
        <div
          className="absolute left-[64px] bottom-[56px] max-w-[320px] pointer-events-auto"
          style={{ color: '#111827' }}
        >
          <p className="text-[11px] font-medium leading-none tracking-tight">
            {metadata.website || 'https://xylozentech.com/'}
          </p>
        </div>

        {/* Left Footer Info (Address) - wrapped to 310px max width so it stays completely clear of the dark blue wave */}
        <div
          className="absolute left-[64px] bottom-[10px] w-[310px] pointer-events-auto"
          style={{ color: '#374151' }}
        >
          <p className="text-[10px] leading-[1.3] text-gray-700">
            {metadata.address ||
              'Anjali by Vikaan shelters, 122 murugu nagar 6th street velachery chennai 600042'}
          </p>
        </div>

        {/* Right Footer Info (Mobile) - left-aligned directly next to Phone icon inside dark blue wave */}
        <div
          className="absolute left-[590px] bottom-[44px] max-w-[190px] pointer-events-auto"
          style={{ color: '#ffffff' }}
        >
          <p className="text-[11px] font-semibold leading-none tracking-wide text-white">
            {metadata.mobile || '+91 95512 82002'}
          </p>
        </div>

        {/* Right Footer Info (Email) - left-aligned directly next to Mail icon inside dark blue wave */}
        <div
          className="absolute left-[590px] bottom-[10px] max-w-[190px] pointer-events-auto"
          style={{ color: '#f3f4f6' }}
        >
          <p className="text-[10.5px] font-normal leading-none text-gray-100">
            {metadata.email || 'support@xylozentech.com'}
          </p>
        </div>
      </div>
    </div>
  );
};
