/**
 * Auto-pagination engine for A4 Letterhead invoices and quotations.
 * Automatically splits HTML content across pages so that content never overflows
 * into the letterhead banner or bottom contact footer.
 */

export interface PaginationOptions {
  maxPageHeight?: number; // Height for pages without signatory (default: 820px)
  maxLastPageHeight?: number; // Height for last page with signatory (default: 720px)
  pageWidth?: number; // Content width matching px-14 inside 794px sheet (default: 682px)
}

export const DEFAULT_MAX_PAGE_HEIGHT = 820;
export const DEFAULT_MAX_LAST_PAGE_HEIGHT = 720;
export const DEFAULT_PAGE_WIDTH = 682;

/**
 * Splits HTML by explicit page break markers if present.
 */
function splitByExplicitPageBreaks(html: string): string[] {
  if (!html) return [];
  // Match <!-- page-break --> or <hr class="page-break"...> or <div class="page-break"...>
  const pageBreakRegex =
    /<!--\s*page-break\s*-->|<hr[^>]*class=["'][^"']*page-break[^"']*["'][^>]*\/?>|<div[^>]*class=["'][^"']*page-break[^"']*["'][^>]*>.*?<\/div>/gi;
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
 * Splits a long paragraph cleanly across page boundaries at a sentence or word boundary.
 */
function splitParagraphBySentences(
  pEl: HTMLElement,
  availableHeight: number,
  staging: HTMLElement
): { firstChunkHtml: string; remainingChunkHtml: string } | null {
  const text = pEl.innerText || pEl.textContent || '';
  if (!text.trim() || availableHeight < 35) return null;

  // Split into sentences (preserving punctuation)
  const sentenceMatches = text.match(/[^.!?\n]+[.!?\n]+(\s+|$)|[^.!?\n]+$/g);
  const units =
    sentenceMatches && sentenceMatches.length > 1
      ? sentenceMatches
      : text.split(/\s+/).map((w, i, arr) => (i < arr.length - 1 ? `${w} ` : w));

  if (units.length <= 1) return null;

  let low = 1;
  let high = units.length - 1;
  let bestFit = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = units.slice(0, mid).join('');
    staging.innerHTML = `<p>${candidate}</p>`;
    const h = staging.offsetHeight;
    if (h <= availableHeight) {
      bestFit = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (bestFit <= 0) return null;

  const firstPart = units.slice(0, bestFit).join('').trim();
  const secondPart = units.slice(bestFit).join('').trim();
  if (!firstPart || !secondPart) return null;

  return {
    firstChunkHtml: `<p>${firstPart}</p>`,
    remainingChunkHtml: `<p>${secondPart}</p>`,
  };
}

/**
 * Creates temporary offscreen measurement staging container with exact matching styles
 */
export function createStagingContainer(pageWidth: number = DEFAULT_PAGE_WIDTH): HTMLDivElement {
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
  return staging;
}

export interface PageHeightStatus {
  height: number;
  maxHeight: number;
  percentage: number;
  isOverflowing: boolean;
}

/**
 * Accurately measures the rendered A4 height of an HTML string against page budget
 */
export function measurePageHeight(
  html: string,
  isLastPage?: boolean,
  options?: PaginationOptions
): PageHeightStatus {
  const maxPageHeight = options?.maxPageHeight ?? DEFAULT_MAX_PAGE_HEIGHT;
  const maxLastPageHeight = options?.maxLastPageHeight ?? DEFAULT_MAX_LAST_PAGE_HEIGHT;
  const pageWidth = options?.pageWidth ?? DEFAULT_PAGE_WIDTH;
  const maxHeight = isLastPage ? maxLastPageHeight : maxPageHeight;

  if (typeof document === 'undefined' || !html || !html.trim()) {
    return { height: 0, maxHeight, percentage: 0, isOverflowing: false };
  }

  const staging = createStagingContainer(pageWidth);
  staging.innerHTML = html;
  document.body.appendChild(staging);

  try {
    const height = staging.offsetHeight;
    const percentage = Math.round((height / maxHeight) * 100);
    const isOverflowing = height > maxHeight;
    return { height, maxHeight, percentage, isOverflowing };
  } finally {
    if (staging.parentNode) {
      staging.parentNode.removeChild(staging);
    }
  }
}

/**
 * Measures and partitions an HTML section's top-level blocks across A4 page sheets.
 */
function partitionSectionBlocks(
  sectionHtml: string,
  maxPageHeight: number,
  pageWidth: number
): string[] {
  if (typeof document === 'undefined') {
    return [sectionHtml];
  }

  const staging = createStagingContainer(pageWidth);
  staging.innerHTML = sectionHtml;
  document.body.appendChild(staging);

  try {
    const totalHeight = staging.offsetHeight;
    if (totalHeight <= maxPageHeight) {
      return [sectionHtml];
    }

    const children = Array.from(staging.children) as HTMLElement[];
    if (children.length === 0) {
      return [sectionHtml];
    }

    const pages: string[] = [];
    let currentPageBlocks: string[] = [];
    let currentHeight = 0;

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
      if (currentHeight + elHeight > maxPageHeight && currentPageBlocks.length > 0) {
        // Table row splitting handling
        if (child.tagName === 'TABLE') {
          const tableEl = child as HTMLTableElement;
          const availableSpace = maxPageHeight - currentHeight;

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

        // Paragraph splitting handling if paragraph is long
        if (child.tagName === 'P') {
          const availableSpace = maxPageHeight - currentHeight;
          if (availableSpace > 120) {
            const split = splitParagraphBySentences(child, availableSpace - 20, staging);
            if (split) {
              currentPageBlocks.push(split.firstChunkHtml);
              pages.push(currentPageBlocks.join('\n'));

              currentPageBlocks = [split.remainingChunkHtml];
              staging.innerHTML = split.remainingChunkHtml;
              currentHeight = staging.offsetHeight;
              continue;
            }
          }
        }

        // Avoid orphan headings: if the last element on currentPage is a heading, push it to the next page
        const lastIndex = currentPageBlocks.length - 1;
        const lastBlockHtml = currentPageBlocks[lastIndex];
        const isLastBlockHeading = /^<h[1-6]/i.test(lastBlockHtml.trim());

        if (isLastBlockHeading && currentPageBlocks.length > 1) {
          currentPageBlocks.pop();
          pages.push(currentPageBlocks.join('\n'));
          currentPageBlocks = [lastBlockHtml, child.outerHTML];
          currentHeight = elHeight + 40;
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

    return pages.length > 0 ? pages : [sectionHtml];
  } finally {
    if (staging.parentNode) {
      staging.parentNode.removeChild(staging);
    }
  }
}

/**
 * Ensures the last page has enough vertical clearance for the authorized signatory
 * without clipping any text. If the last page exceeds maxLastPageHeight, pushes blocks
 * (or split paragraph/table rows) to a new subsequent page.
 */
function enforceFinalPageSignatoryBudget(
  pages: string[],
  maxLastPageHeight: number,
  pageWidth: number
): string[] {
  if (typeof document === 'undefined' || pages.length === 0) return pages;

  const staging = createStagingContainer(pageWidth);
  document.body.appendChild(staging);

  try {
    const result = [...pages];

    while (result.length > 0) {
      const lastIndex = result.length - 1;
      const lastPageHtml = result[lastIndex];
      staging.innerHTML = lastPageHtml;

      const currentLastHeight = staging.offsetHeight;
      if (currentLastHeight <= maxLastPageHeight) {
        // Last page fits within signatory budget!
        break;
      }

      // Last page exceeds signatory budget. We must move overflowing content to a new page!
      const children = Array.from(staging.children) as HTMLElement[];
      if (children.length <= 1) {
        // Only 1 child (e.g. single large paragraph or table)
        const onlyChild = children[0];
        if (onlyChild && onlyChild.tagName === 'P') {
          const split = splitParagraphBySentences(onlyChild, maxLastPageHeight - 30, staging);
          if (split) {
            result[lastIndex] = split.firstChunkHtml;
            result.push(split.remainingChunkHtml);
            continue;
          }
        } else if (onlyChild && onlyChild.tagName === 'TABLE') {
          const split = splitTableRows(onlyChild as HTMLTableElement, maxLastPageHeight - 40);
          if (split.remainingTableHtml) {
            result[lastIndex] = split.firstChunkHtml;
            result.push(split.remainingTableHtml);
            continue;
          }
        }
        break;
      }

      // Multiple children on last page: move elements from the bottom until height <= maxLastPageHeight
      const movedBlocks: string[] = [];
      const lastPageBlocks = children.map((c) => c.outerHTML);

      while (lastPageBlocks.length > 1) {
        const lastBlockHtml = lastPageBlocks.pop()!;
        movedBlocks.unshift(lastBlockHtml);

        // Check if the new last block is now an orphan heading
        if (lastPageBlocks.length > 0) {
          const newLastBlock = lastPageBlocks[lastPageBlocks.length - 1];
          if (/^<h[1-6]/i.test(newLastBlock.trim())) {
            movedBlocks.unshift(lastPageBlocks.pop()!);
          }
        }

        staging.innerHTML = lastPageBlocks.join('\n');
        if (staging.offsetHeight <= maxLastPageHeight) {
          break;
        }
      }

      result[lastIndex] = lastPageBlocks.join('\n');
      result.push(movedBlocks.join('\n'));
    }

    return result;
  } finally {
    if (staging.parentNode) {
      staging.parentNode.removeChild(staging);
    }
  }
}

/**
 * Splits an overflowing page into fitting HTML (stays on current page)
 * and overflow HTML (moves to the next page or creates a new page).
 */
export function splitPageOverflow(
  html: string,
  isLastPage?: boolean,
  options?: PaginationOptions
): { fittingHtml: string; overflowHtml: string | null; subPages: string[] } {
  const maxPageHeight = options?.maxPageHeight ?? DEFAULT_MAX_PAGE_HEIGHT;
  const maxLastPageHeight = options?.maxLastPageHeight ?? DEFAULT_MAX_LAST_PAGE_HEIGHT;
  const pageWidth = options?.pageWidth ?? DEFAULT_PAGE_WIDTH;

  if (!html || !html.trim()) {
    return { fittingHtml: '', overflowHtml: null, subPages: [''] };
  }

  // Check if it has explicit page breaks first
  const explicitBreakParts = splitByExplicitPageBreaks(html);
  if (explicitBreakParts.length > 1) {
    const fittingHtml = explicitBreakParts[0];
    const overflowHtml = explicitBreakParts.slice(1).join('\n<!-- page-break -->\n');
    return {
      fittingHtml,
      overflowHtml,
      subPages: explicitBreakParts,
    };
  }

  const targetLastPageHeight = isLastPage ? maxLastPageHeight : maxPageHeight;

  // Partition section blocks into pages using autoPaginateHtml
  const partitioned = autoPaginateHtml(html, {
    maxPageHeight,
    maxLastPageHeight: targetLastPageHeight,
    pageWidth,
  });

  if (partitioned.length <= 1) {
    return { fittingHtml: html, overflowHtml: null, subPages: [html] };
  }

  return {
    fittingHtml: partitioned[0],
    overflowHtml: partitioned.slice(1).join('\n<!-- page-break -->\n'),
    subPages: partitioned,
  };
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

  const intermediatePages: string[] = [];

  for (let i = 0; i < rawSections.length; i++) {
    const section = rawSections[i];
    if (!section.trim()) continue;

    // Partition blocks using maxPageHeight
    const subPages = partitionSectionBlocks(section, maxPageHeight, pageWidth);
    intermediatePages.push(...subPages);
  }

  if (intermediatePages.length === 0) return [''];

  // Enforce that the final page satisfies the signatory clearance budget
  return enforceFinalPageSignatoryBudget(
    intermediatePages,
    maxLastPageHeight,
    pageWidth
  );
}

/**
 * Takes an array of page HTML strings, checks each page sequentially,
 * and cascades any overflowing content into subsequent pages (creating new pages as needed),
 * ensuring every page is within the A4 height budget.
 */
export function cascadeDocumentPages(
  pages: string[],
  options?: PaginationOptions
): string[] {
  if (!pages || pages.length === 0) return [''];
  return autoPaginateHtml(pages, options);
}
