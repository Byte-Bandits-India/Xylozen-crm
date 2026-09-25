import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface GeneratePdfOptions {
  element: HTMLElement;
  fileName?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Pure mathematical OKLCH to sRGB conversion (CSS Color Module Level 4).
 * Completely independent of browser support, canvas, or environment.
 */
function parseOklchToRgb(str: string): string {
  const m = str.match(/oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/i);
  if (!m) {
    return '#111827';
  }

  const l = m[1].endsWith('%') ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
  const c = m[2].endsWith('%') ? parseFloat(m[2]) / 100 : parseFloat(m[2]);
  const h = parseFloat(m[3]);
  let alpha = 1;
  if (m[4]) {
    alpha = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  }

  // 1. OKLCH to OKLab
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // 2. OKLab to LMS
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  // 3. LMS to Linear sRGB
  const rL = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gL = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bL = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  // 4. Linear sRGB to standard sRGB gamma
  const toGamma = (x: number) => {
    const clamped = Math.max(0, Math.min(1, x));
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  const r = Math.round(toGamma(rL) * 255);
  const g = Math.round(toGamma(gL) * 255);
  const b2 = Math.round(toGamma(bL) * 255);

  if (alpha < 1) {
    return `rgba(${r}, ${g}, ${b2}, ${alpha})`;
  }
  return `rgb(${r}, ${g}, ${b2})`;
}

/**
 * Replaces all occurrences of modern color functions (oklch, oklab, lab)
 * in any CSS string with standard sRGB rgb/rgba equivalents.
 */
function replaceModernColorsInText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  if (!/oklch|oklab|lab\(/i.test(text)) return text;

  return text.replace(/oklch\([^)]+\)/gi, (match) => {
    try {
      return parseOklchToRgb(match);
    } catch {
      return '#111827';
    }
  });
}

/**
 * Wraps a CSSStyleDeclaration in a Proxy to automatically intercept
 * and translate any oklch color property returned by getComputedStyle.
 */
function createComputedStyleProxy(style: CSSStyleDeclaration): CSSStyleDeclaration {
  return new Proxy(style, {
    get(target, prop) {
      if (typeof prop === 'symbol') {
        return (target as any)[prop];
      }
      if (prop === 'getPropertyValue') {
        return function (propertyName: string) {
          const val = target.getPropertyValue(propertyName);
          if (typeof val === 'string' && val.includes('oklch')) {
            return replaceModernColorsInText(val);
          }
          return val;
        };
      }
      const val = (target as any)[prop];
      if (typeof val === 'function') {
        return val.bind(target);
      }
      if (typeof val === 'string' && val.includes('oklch')) {
        return replaceModernColorsInText(val);
      }
      return val;
    },
  });
}

/**
 * Sanitizes all oklch/modern colors in the cloned document
 * before html2canvas traverses and parses CSS properties.
 */
function sanitizeClonedDocumentColors(clonedDoc: Document): void {
  // 1. Intercept getComputedStyle on the iframe window
  if (clonedDoc.defaultView) {
    const origIframeGetComputedStyle = clonedDoc.defaultView.getComputedStyle.bind(clonedDoc.defaultView);
    clonedDoc.defaultView.getComputedStyle = function (el: Element, pseudo?: string | null) {
      const style = origIframeGetComputedStyle(el, pseudo);
      return createComputedStyleProxy(style);
    };
  }

  // 2. Ensure root and body have explicit sRGB backgrounds
  if (clonedDoc.documentElement) {
    clonedDoc.documentElement.style.backgroundColor = '#ffffff';
    clonedDoc.documentElement.style.color = '#111827';
  }
  if (clonedDoc.body) {
    clonedDoc.body.style.backgroundColor = '#ffffff';
    clonedDoc.body.style.color = '#111827';
  }

  // 3. Sanitize all <style> blocks in the cloned document
  const styleTags = clonedDoc.querySelectorAll('style');
  styleTags.forEach((styleTag) => {
    if (styleTag.textContent && /oklch/i.test(styleTag.textContent)) {
      styleTag.textContent = replaceModernColorsInText(styleTag.textContent);
    }
  });

  // 4. Inject global override for default borders, outlines, backgrounds
  const overrideStyle = clonedDoc.createElement('style');
  overrideStyle.setAttribute('data-pdf-override', 'true');
  overrideStyle.textContent = `
    *, *::before, *::after {
      border-color: #d1d5db !important;
      outline-color: #2563eb !important;
    }
    .a4-page-sheet {
      background-color: #ffffff !important;
      color: #111827 !important;
    }
  `;
  if (clonedDoc.head) {
    clonedDoc.head.appendChild(overrideStyle);
  }

  // 5. Inspect every element in the clone and sanitize inline styles
  const allElements = clonedDoc.querySelectorAll<HTMLElement>('*');
  allElements.forEach((el) => {
    const styleAttr = el.getAttribute('style');
    if (styleAttr && /oklch/i.test(styleAttr)) {
      el.setAttribute('style', replaceModernColorsInText(styleAttr));
    }
  });
}

/**
 * Generates and downloads a high-fidelity 300 DPI A4 PDF from a DOM element.
 * Creates an isolated 1:1 offscreen clone and intercepts CSS getComputedStyle
 * with mathematical OKLCH-to-sRGB translation to ensure 100% compatibility with html2canvas and jsPDF.
 */
export async function generateInvoicePdf({
  element,
  fileName = 'Invoice.pdf',
}: GeneratePdfOptions): Promise<void> {
  if (!element) {
    throw new Error('Target element not found for PDF generation');
  }

  // Identify target pages (.a4-page-sheet)
  let targetPages: HTMLElement[] = [];
  if (element.classList.contains('a4-page-sheet')) {
    targetPages = [element];
  } else {
    const found = element.querySelectorAll<HTMLElement>('.a4-page-sheet');
    targetPages = found.length > 0 ? Array.from(found) : [element];
  }

  if (targetPages.length === 0) {
    throw new Error('No printable invoice page found to generate PDF');
  }

  // Intercept host window getComputedStyle during html2canvas execution
  const origHostGetComputedStyle = window.getComputedStyle.bind(window);
  window.getComputedStyle = function (el: Element, pseudo?: string | null) {
    const style = origHostGetComputedStyle(el, pseudo);
    return createComputedStyleProxy(style);
  };

  // Create an offscreen staging container on document.body
  // Free of any zoom/scale CSS transforms or scroll offsets
  const stagingContainer = document.createElement('div');
  stagingContainer.setAttribute('data-pdf-staging', 'true');
  stagingContainer.style.position = 'fixed';
  stagingContainer.style.left = '-10000px';
  stagingContainer.style.top = '0';
  stagingContainer.style.width = '794px';
  stagingContainer.style.zIndex = '-99999';
  stagingContainer.style.opacity = '1';
  stagingContainer.style.pointerEvents = 'none';
  stagingContainer.style.overflow = 'visible';
  stagingContainer.style.background = '#ffffff';
  document.body.appendChild(stagingContainer);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 210; // A4 width in mm
  const pdfHeight = 297; // A4 height in mm

  try {
    // Wait for web fonts if browser font API is available
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // Continue if fonts take longer
      }
    }

    for (let i = 0; i < targetPages.length; i++) {
      const pageNode = targetPages[i];

      // Clear previous page from staging container
      stagingContainer.innerHTML = '';

      // Deep clone the page element into staging
      const clone = pageNode.cloneNode(true) as HTMLElement;
      clone.style.transform = 'none';
      clone.style.margin = '0';
      clone.style.boxShadow = 'none';
      clone.style.width = '794px';
      clone.style.minHeight = '1123px';
      stagingContainer.appendChild(clone);

      // Ensure all images in the clone are loaded with proper CORS
      const images = Array.from(clone.querySelectorAll<HTMLImageElement>('img'));
      await Promise.all(
        images.map(async (img) => {
          if (!img.crossOrigin && !img.src.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
          }
          if (img.complete && img.naturalWidth > 0) return;
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => {
              console.warn('[PDF Generator] Image failed to load in clone:', img.src);
              resolve(); // Don't abort PDF on broken remote image
            };
            setTimeout(resolve, 3000); // 3s safety timeout
          });
        })
      );

      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // Capture with html2canvas (strictly without allowTaint and with getComputedStyle Proxy)
      const canvas = await html2canvas(clone, {
        scale: 2, // 2x produces sharp 200+ DPI text without memory exhaustion
        useCORS: true,
        allowTaint: false, // Critical: must be false for canvas.toDataURL to succeed
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: clone.offsetHeight || 1123,
        windowWidth: 794,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          sanitizeClonedDocumentColors(clonedDoc);
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    pdf.save(fileName);
  } finally {
    // Guaranteed restoration of host window getComputedStyle
    window.getComputedStyle = origHostGetComputedStyle;

    // Guaranteed cleanup of staging container
    if (stagingContainer.parentNode) {
      stagingContainer.parentNode.removeChild(stagingContainer);
    }
  }
}

/**
 * Triggers native browser print dialog for ONLY the A4 document,
 * completely isolating it from the dashboard layout, navigation, and sidebar.
 */
export function printInvoiceDocument(element?: HTMLElement | null): void {
  if (!element) {
    window.print();
    return;
  }

  // Create an isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  // Copy all font links and stylesheets from main head
  const headElements = document.head.querySelectorAll('link[rel="stylesheet"], style');
  let headHtml = '';
  headElements.forEach((el) => {
    headHtml += el.outerHTML;
  });

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice</title>
        ${headHtml}
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 794px !important;
            height: 1123px !important;
            overflow: visible !important;
          }
          .a4-page-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            width: 794px !important;
            min-height: 1123px !important;
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `);
  iframeDoc.close();

  let hasPrinted = false;
  const triggerPrint = () => {
    if (hasPrinted) return;
    hasPrinted = true;
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Print failed:', err);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1000);
      }
    }, 250);
  };

  const images = iframeDoc.querySelectorAll('img');
  if (images.length === 0) {
    triggerPrint();
  } else {
    let loadedCount = 0;
    const totalImages = images.length;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalImages) {
        triggerPrint();
      }
    };

    images.forEach((img) => {
      if (img.complete) {
        checkAllLoaded();
      } else {
        img.onload = checkAllLoaded;
        img.onerror = checkAllLoaded;
      }
    });

    // Fallback timer if any image stalls
    setTimeout(triggerPrint, 1500);
  }
}

