import type { InvoiceDocumentJSON } from '../types';

export const DEFAULT_DOCUMENT_TITLE = 'Estimate';
export const DEFAULT_WEBSITE = 'https://xylozentech.com/';
export const DEFAULT_ADDRESS = 'Anjali by Vikaan shelters, 122 murugu nagar 6th street velachery chennai 600042';
export const DEFAULT_MOBILE = '+91 95512 82002';
export const DEFAULT_EMAIL = 'support@xylozentech.com';
export const DEFAULT_SIGNATORY_NAME = 'Hariharan C';
export const DEFAULT_SIGNATORY_TITLE = 'Authorized Signatory';

export const DEFAULT_ESTIMATE_HTML = `
<h1 style="text-align: center;"><u><strong>Estimate</strong></u></h1>

<h2><strong>Project Overview</strong></h2>
<p>Pramodinj is looking to launch a professional business website that clearly communicates its services, builds credibility with prospective customers, and makes it easy for visitors to get in touch. Xylozen will design and develop a modern, responsive brochure website built for fast load times, mobile-first browsing, and easy content updates going forward.</p>

<h2><strong>Scope of Work</strong></h2>
<p>The Developer is responsible for constructing and delivering a responsive 5-7 page website that utilizes Next.js, taking into account the designs and content supplied by the Client. This involves making sure that the designs are turned into functioning pages, incorporating the text and content provided by the client, implementing email integration with the contact form, and creating on-page SEO (page titles, meta descriptions, semantic HTML, image alt text, sitemap, robots.txt, and clean URLs). The website will undergo cross-browser and mobile testing before being delivered to the client. The Client guarantees delivery of designs, content, and brand assets at an appropriate time.</p>

<h2><strong>Deliverables</strong></h2>
<p>Fully functional, responsive website with Basic SEO for ( 5-7 pages ) and Email Integration with the Source files and clean code.</p>

<table style="width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 16px;">
  <thead>
    <tr>
      <th style="background-color: #dce8fd; border: 1px solid #111827; padding: 10px; font-weight: bold; text-align: left;">Email Pricing for Basic Plan</th>
      <th style="background-color: #dce8fd; border: 1px solid #111827; padding: 10px; font-weight: bold; text-align: left;">Email Pricing for Additional Features</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #111827; padding: 10px; vertical-align: top;">
        <strong>Basic Email:</strong> Contact form → sends email to client's inbox as notifying the site Owner When form is Submitted.
      </td>
      <td style="border: 1px solid #111827; padding: 10px; vertical-align: top;">
        Same as basic, along with an auto-reply email back to the user, Multiple forms and designer emails.
      </td>
    </tr>
  </tbody>
</table>
`.trim();

export function getDefaultDocumentJSON(): InvoiceDocumentJSON {
  return {
    documentFormat: 'tiptap-v2',
    documentTitle: DEFAULT_DOCUMENT_TITLE,
    documentHtml: DEFAULT_ESTIMATE_HTML,
    companyDetails: {
      website: DEFAULT_WEBSITE,
      address: DEFAULT_ADDRESS,
      mobile: DEFAULT_MOBILE,
      email: DEFAULT_EMAIL,
    },
    signatory: {
      name: DEFAULT_SIGNATORY_NAME,
      title: DEFAULT_SIGNATORY_TITLE,
    },
    notes: 'Thank you for choosing Xylozen Technologies. All work is guaranteed as specified in the Scope of Work.',
  };
}

export function serializeDocument(doc: InvoiceDocumentJSON): string {
  try {
    return JSON.stringify(doc);
  } catch (err) {
    console.error('Failed to serialize invoice document:', err);
    return JSON.stringify(getDefaultDocumentJSON());
  }
}

export function deserializeDocument(rawDescription?: string | null): InvoiceDocumentJSON {
  if (!rawDescription || !rawDescription.trim()) {
    return getDefaultDocumentJSON();
  }

  const trimmed = rawDescription.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.documentHtml || parsed.documentFormat) {
        let html = parsed.documentHtml || DEFAULT_ESTIMATE_HTML;
        // If the documentHtml doesn't already contain a heading, inject the heading from documentTitle or default
        if (!html.includes('<h1') && (parsed.documentTitle || DEFAULT_DOCUMENT_TITLE)) {
          const heading = parsed.documentTitle || DEFAULT_DOCUMENT_TITLE;
          html = `<h1 style="text-align: center;"><u><strong>${heading}</strong></u></h1>\n\n` + html;
        }

        return {
          documentFormat: parsed.documentFormat || 'tiptap-v2',
          documentTitle: parsed.documentTitle || DEFAULT_DOCUMENT_TITLE,
          documentHtml: html,
          documentBody: parsed.documentBody,
          companyDetails: {
            website: parsed.companyDetails?.website || DEFAULT_WEBSITE,
            address: parsed.companyDetails?.address || DEFAULT_ADDRESS,
            mobile: parsed.companyDetails?.mobile || DEFAULT_MOBILE,
            email: parsed.companyDetails?.email || DEFAULT_EMAIL,
          },
          signatory: {
            userPublicId: parsed.signatory?.userPublicId,
            name: parsed.signatory?.name || parsed.signatoryName || DEFAULT_SIGNATORY_NAME,
            title: parsed.signatory?.title || parsed.signatoryTitle || DEFAULT_SIGNATORY_TITLE,
            signatureImage: parsed.signatory?.signatureImage,
          },
          createdByUserPublicId: parsed.createdByUserPublicId,
          notes: parsed.notes || '',
        };
      }
    } catch {
      // Fallback below
    }
  }

  // Backward compatibility: Convert raw plain text to HTML document
  const paragraphs = trimmed
    .split('\n\n')
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  const defaultHtmlWithHeading = `<h1 style="text-align: center;"><u><strong>${DEFAULT_DOCUMENT_TITLE}</strong></u></h1>\n\n${paragraphs}`;

  return {
    documentFormat: 'plain-text-migrated',
    documentTitle: DEFAULT_DOCUMENT_TITLE,
    documentHtml: paragraphs ? defaultHtmlWithHeading : DEFAULT_ESTIMATE_HTML,
    companyDetails: {
      website: DEFAULT_WEBSITE,
      address: DEFAULT_ADDRESS,
      mobile: DEFAULT_MOBILE,
      email: DEFAULT_EMAIL,
    },
    signatory: {
      name: DEFAULT_SIGNATORY_NAME,
      title: DEFAULT_SIGNATORY_TITLE,
    },
    notes: '',
  };
}
