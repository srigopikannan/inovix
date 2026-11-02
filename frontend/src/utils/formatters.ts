/**
 * ROADGUARD AI — Standard Indian Currency and Number Formatter Utility
 * Compliant with Indian Numbering System (thousands, lakhs, crores) and INR (₹).
 */

/**
 * Reusable Intl formatter for Indian Rupee currency display.
 */
export const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0
});

/**
 * Formats a numeric amount in Indian Rupees (₹) with proper Indian comma placement:
 * ₹1,000 | ₹10,000 | ₹1,00,000 (1 Lakh) | ₹1,00,00,000 (1 Crore)
 */
export function formatINR(
  amount: number | null | undefined,
  options?: {
    decimals?: number;
    compact?: boolean;
  }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  const { decimals = 2, compact = false } = options || {};

  if (compact && Math.abs(amount) >= 100000) {
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(decimals)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(decimals)} L`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
}

/**
 * Formats a plain number using the Indian grouping system (without currency symbol).
 * e.g. 100000 -> 1,00,000
 */
export function formatIndianNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN').format(value);
}
