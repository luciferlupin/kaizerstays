export const HOTEL_ACCOMMODATION_GST_RATE = 5;
export const HOTEL_ACCOMMODATION_CGST_RATE = 2.5;
export const HOTEL_ACCOMMODATION_SGST_RATE = 2.5;

export interface InclusiveGSTBreakdown {
  totalInclusive: number;
  taxableValue: number;
  totalTax: number;
  cgst: number;
  sgst: number;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Extract GST already included in the charged amount.
 * For 5% GST: taxable value = total / 1.05, then CGST and SGST split the tax equally.
 */
export function calculateInclusiveHotelGST(
  totalInclusive: number
): InclusiveGSTBreakdown {
  const safeTotal = roundMoney(Math.max(0, Number(totalInclusive) || 0));
  const taxableValue = roundMoney(
    safeTotal / (1 + HOTEL_ACCOMMODATION_GST_RATE / 100)
  );
  const totalTax = roundMoney(safeTotal - taxableValue);
  const cgst = roundMoney(totalTax / 2);
  const sgst = roundMoney(totalTax - cgst);

  return {
    totalInclusive: safeTotal,
    taxableValue,
    totalTax,
    cgst,
    sgst,
    gstRate: HOTEL_ACCOMMODATION_GST_RATE,
    cgstRate: HOTEL_ACCOMMODATION_CGST_RATE,
    sgstRate: HOTEL_ACCOMMODATION_SGST_RATE,
  };
}
