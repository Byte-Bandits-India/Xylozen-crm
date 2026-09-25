/**
 * Computes the next sequential invoice number in the order-wise structure starting from XY0001.
 * e.g., XY0001, XY0002, XY0003...
 */
export function getNextInvoiceNumber(existingInvoices: Array<{ invoiceNumber?: string }> = []): string {
  let maxNum = 0;
  for (const inv of existingInvoices) {
    if (!inv.invoiceNumber) continue;
    const match = inv.invoiceNumber.match(/^XY[-_]?(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }
  let nextNum = maxNum + 1;
  let candidate = `XY${String(nextNum).padStart(4, '0')}`;
  const existingSet = new Set(existingInvoices.map((i) => i.invoiceNumber));
  while (existingSet.has(candidate)) {
    nextNum++;
    candidate = `XY${String(nextNum).padStart(4, '0')}`;
  }
  return candidate;
}

export function generateInvoiceNumber(existingInvoices: Array<{ invoiceNumber?: string }> = []): string {
  return getNextInvoiceNumber(existingInvoices);
}

export function formatCurrency(amount: number | string | undefined | null, currency: string = 'INR'): string {
  const numericAmount = typeof amount === 'number' ? amount : Number(amount) || 0;
  
  const symbolMap: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const symbol = symbolMap[currency] || currency;
  return `${symbol} ${numericAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
