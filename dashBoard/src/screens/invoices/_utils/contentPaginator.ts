/**
 * Auto-pagination engine for A4 Letterhead invoices and quotations.
 * Automatically splits HTML content across pages so that content never overflows
 * into the letterhead banner or bottom contact footer.
 */

export interface PaginationOptions {
  maxPageHeight?: number; // Height for pages without signatory (default: 860px)
  maxLastPageHeight?: number; // Height for last page with signatory (default: 780px)
  pageWidth?: number; // Content width matching px-14 inside 794px sheet (default: 682px)
}

const DEFAULT_MAX_PAGE_HEIGHT = 860;
const DEFAULT_MAX_LAST_PAGE_HEIGHT = 780;
const DEFAULT_PAGE_WIDTH = 682;

/**
 * Splits HTML by explicit page break markers if present.
 */
function splitByExplicitPageBreaks(html: string): string[] {
  if (!html) return [];
  // Match <!-- page-break --> or <hr class="page-break"...> or <div class="page-break"...>
  const pageBreakRegex = /<!--\s*page-break\s*-->|<hr[^>]*class=["'][^"']*page-break[^"']*["'][^>]*\/?>|<div[^>]*class=["'][^"']*page-break[^"']*["'][^>]*>.*?<\/div>/gi;
  const parts = html.split(pageBreakRegex).map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [html];
}

/**
 * Calculates element height including vertical margins.
 */
function getElementTotalHeight(el: HTMLElement): number {
  const style = window.getComputedStyle(el);
  const mt = parseFloat(style.marginTop) || 0;
  const mb = parseFloat(style.marginBottom) || 0;
  return el.offsetHeight + mt + mb;
}

/**
 * Splits a single table across pages by rows, copying the thead to subsequent pages.
 */
function splitTableRows(
  tableEl: HTMLTableElement,
  availableHeight: number
): { firstChunkHtml: string; remainingTableHtml: string | null } {
  const thead = tableEl.querySelector('thead');
  const theadHtml = thead ? thead.outerHTML : '';
  const theadHeight = thead ? getElementTotalHeight(thead as HTMLElement) : 35;

  const rows = Array.from(tableEl.querySelectorAll('tbody tr')) as HTMLElement[];
  if (rows.length <= 1) {
    return { firstChunkHtml: tableEl.outerHTML, remainingTableHtml: null };
  }

  const tableAttributes = Array.from(tableEl.attributes)
    .map((attr) => `${attr.name}="${attr.value}"`)
    .join(' ');

  let currentChunkHeight = theadHeight;
  const firstRows: string[] = [];
  const remainingRows: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowHeight = getElementTotalHeight(row);

    if (firstRows.length === 0 || currentChunkHeight + rowHeight <= availableHeight) {
      firstRows.push(row.outerHTML);
      currentChunkHeight += rowHeight;
    } else {
      remainingRows.push(row.outerHTML);
    }
  }

  if (remainingRows.length === 0) {
    return { firstChunkHtml: tableEl.outerHTML, remainingTableHtml: null };
  }

  const firstChunkHtml = `<table ${tableAttributes}>${theadHtml}<tbody>${firstRows.join('')}</tbody></table>`;
  const remainingTableHtml = `<table ${tableAttributes}>${theadHtml}<tbody>${remainingRows.join('')}</tbody></table>`;

  return { firstChunkHtml, remainingTableHtml };
}

/**
 * Measures and partitions an HTML section's top-level blocks across A4 page sheets.
 */
function partitionSectionBlocks(
  sectionHtml: string,
  maxPageHeight: number,
  maxLastPageHeight: number,
  pageWidth: number
): string[] {
  if (typeof document === 'undefined') {
    return [sectionHtml];
  }

  // Create temporary offscreen measurement staging container with exact matching styles
  const staging = document.createElement('div');
  staging.setAttribute('data-pagination-staging', 'true');
  staging.style.position = 'fixed';
  staging.style.left = '-9999px';
  staging.style.top = '0';
  staging.style.width = `${pageWidth}px`;
  staging.style.visibility = 'hidden';
  staging.style.pointerEvents = 'none';
  staging.style.zIndex = '-99999';
  staging.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  staging.className =
    'invoice-doc-body prose prose-sm max-w-none text-gray-850 leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-950 [&_h1]:text-center [&_h1]:mb-6 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-950 [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-1.5 [&_p]:text-[13px] [&_p]:leading-[1.65] [&_p]:text-gray-800 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:text-[13px] [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:text-[13px] [&_table]:w-full [&_table]:table-fixed [&_table]:border-collapse [&_table]:my-5 [&_table]:border [&_table]:border-gray-900 [&_th]:bg-[#dce8fd] [&_th]:border [&_th]:border-gray-900 [&_th]:p-2.5 [&_th]:text-[12.5px] [&_th]:font-bold [&_th]:text-gray-900 [&_th]:text-left [&_td]:border [&_td]:border-gray-900 [&_td]:p-2.5 [&_td]:text-[12.5px] [&_td]:text-gray-800 [&_td]:align-top';

  staging.innerHTML = sectionHtml;
  document.body.appendChild(staging);

  try {
    const totalHeight = staging.offsetHeight;
    // If entire section fits within the last-page limit (leaving room for signatory), keep it on 1 page!
    if (totalHeight <= maxLastPageHeight) {
      return [sectionHtml];
    }

    const children = Array.from(staging.children) as HTMLElement[];
    if (children.length === 0) {
      return [sectionHtml];
    }

    const pages: string[] = [];
    let currentPageBlocks: string[] = [];
    let currentHeight = 0;
    const pageLimit = maxPageHeight;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const elHeight = getElementTotalHeight(child);

      // Check for manual page break markers
      if (
        child.classList.contains('page-break') ||
        child.getAttribute('data-page-break') === 'true'
      ) {
        if (currentPageBlocks.length > 0) {
          pages.push(currentPageBlocks.join('\n'));
          currentPageBlocks = [];
          currentHeight = 0;
        }
        continue;
      }

      // Check if current child overflows current page
      if (currentHeight + elHeight > pageLimit && currentPageBlocks.length > 0) {
        // Table splitting handling: if a table has multiple rows and there's room on this page, split rows
        if (child.tagName === 'TABLE') {
          const tableEl = child as HTMLTableElement;
          const availableSpace = pageLimit - currentHeight;

          if (availableSpace > 100) {
            const { firstChunkHtml, remainingTableHtml } = splitTableRows(
              tableEl,
              availableSpace
            );
            if (remainingTableHtml) {
              currentPageBlocks.push(firstChunkHtml);
              pages.push(currentPageBlocks.join('\n'));

              currentPageBlocks = [remainingTableHtml];
              staging.innerHTML = remainingTableHtml;
              currentHeight = staging.offsetHeight;
              continue;
            }
          }
        }

        // Avoid orphan headings: if the last element on currentPage is a heading, push it to the next page
        const lastIndex = currentPageBlocks.length - 1;
        const lastBlockHtml = currentPageBlocks[lastIndex];
        const isLastBlockHeading = /^<h[1-6]/i.test(lastBlockHtml);

        if (isLastBlockHeading && currentPageBlocks.length > 1) {
          currentPageBlocks.pop();
          pages.push(currentPageBlocks.join('\n'));
          currentPageBlocks = [lastBlockHtml, child.outerHTML];
          currentHeight = elHeight + 40; // rough heading height
        } else {
          pages.push(currentPageBlocks.join('\n'));
          currentPageBlocks = [child.outerHTML];
          currentHeight = elHeight;
        }
      } else {
        currentPageBlocks.push(child.outerHTML);
        currentHeight += elHeight;
      }
    }

    if (currentPageBlocks.length > 0) {
      pages.push(currentPageBlocks.join('\n'));
    }

    // Only if this section already split into multiple pages, ensure the final page leaves room for signatory
    if (pages.length > 1) {
      const lastPageHtml = pages[pages.length - 1];
      staging.innerHTML = lastPageHtml;
      const lastPageHeight = staging.offsetHeight;

      // If last page exceeds maxLastPageHeight and has more than 1 block, push the last block to a new page
      if (lastPageHeight > maxLastPageHeight && staging.children.length > 1) {
        const lastPageChildren = Array.from(staging.children) as HTMLElement[];
        const lastChild = lastPageChildren[lastPageChildren.length - 1];
        const lastChildHtml = lastChild.outerHTML;

        // Remove last child from last page and push to new page
        lastChild.remove();
        pages[pages.length - 1] = staging.innerHTML;
        pages.push(lastChildHtml);
      }
    }

    return pages.length > 0 ? pages : [sectionHtml];
  } finally {
    if (staging.parentNode) {
      staging.parentNode.removeChild(staging);
    }
  }
}

/**
 * Main auto-pagination function. Takes any HTML string or array of HTML strings
 * and returns an array of HTML strings, each guaranteed to fit onto a single A4 page sheet
 * without overlapping headers, footers, or the authorized signatory block.
 */
export function autoPaginateHtml(
  inputHtml: string | string[],
  options?: PaginationOptions
): string[] {
  const maxPageHeight = options?.maxPageHeight ?? DEFAULT_MAX_PAGE_HEIGHT;
  const maxLastPageHeight = options?.maxLastPageHeight ?? DEFAULT_MAX_LAST_PAGE_HEIGHT;
  const pageWidth = options?.pageWidth ?? DEFAULT_PAGE_WIDTH;

  const rawSections: string[] = [];
  if (Array.isArray(inputHtml)) {
    inputHtml.forEach((item) => {
      rawSections.push(...splitByExplicitPageBreaks(item));
    });
  } else {
    rawSections.push(...splitByExplicitPageBreaks(inputHtml));
  }

  const finalPages: string[] = [];

  for (let i = 0; i < rawSections.length; i++) {
    const section = rawSections[i];
    if (!section.trim()) continue;

    const isFinalSection = i === rawSections.length - 1;
    const subPages = partitionSectionBlocks(
      section,
      maxPageHeight,
      isFinalSection ? maxLastPageHeight : maxPageHeight,
      pageWidth
    );

    finalPages.push(...subPages);
  }

  return finalPages.length > 0 ? finalPages : [''];
}
