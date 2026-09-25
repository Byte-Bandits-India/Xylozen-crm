export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export type InvoiceStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PARTIAL'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export interface ClientData {
  id?: string | number;
  publicId: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
}

export interface TeamUser {
  publicId: string;
  name: string;
  email?: string;
  username?: string;
  signatureImage?: string;
}

export interface LineItem {
  id?: string | number;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  discount: number;
  total: number;
}

export interface InvoicePaymentData {
  id?: string | number;
  publicId: string;
  amount: number;
  paymentMethod: string;
  referenceNo?: string;
  notes?: string;
  paidAt: string;
}

export interface CompanyDetails {
  website: string;
  address: string;
  mobile: string;
  email: string;
}

export interface InvoiceMetadata {
  date: string; // Single calendar date (defaults to today)
  invoiceNumber: string; // Auto-generated XY0000 format
  website: string; // Default: https://xylozentech.com/
  address: string; // Default: Anjali by Vikaan shelters, 122 murugu nagar 6th street velachery chennai 600042
  mobile: string; // Default: +91 95512 82002
  email: string; // Default: support@xylozentech.com
  signatoryUserPublicId: string; // Selected from users dropdown
  signatoryName: string; // Selected user's name
  signatorySignatureImage?: string; // Signature image from user profile in Settings
  createdByUserPublicId: string; // Selected from users dropdown
  createdByName?: string; // Creator's name

  // Optional backend and document compatibility fields
  title?: string;
  clientPublicId?: string;
  currency?: Currency;
  status?: InvoiceStatus;
}

export interface InvoiceDocumentJSON {
  documentFormat: string;
  documentTitle: string;
  documentHtml: string;
  documentBody?: any;
  companyDetails?: CompanyDetails;
  signatory?: {
    userPublicId?: string;
    name?: string;
    title?: string;
    signatureImage?: string;
  };
  createdByUserPublicId?: string;
  notes?: string;
}

export interface InvoiceData {
  id?: number | string;
  publicId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  title?: string;
  featureProject?: string;
  description?: string; // Serialized Document JSON
  subtotal: number | string;
  taxAmount: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
  receivedAmount: number | string;
  balanceDue: number | string;
  currency: Currency;
  issuedDate: string;
  dueDate: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
  createdByPublicId?: string;
  createdBy?: {
    publicId: string;
    username: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  clients?: Array<{ client: ClientData }>;
  clientPublicId?: string;
  client?: ClientData;
  items?: LineItem[];
  payments?: InvoicePaymentData[];
}
