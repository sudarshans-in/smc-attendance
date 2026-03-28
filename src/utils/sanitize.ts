/**
 * Input sanitization utilities.
 * These run on the client before values are sent to the API.
 * The backend must also validate and sanitize all input independently.
 */

// Strip leading/trailing whitespace and collapse internal whitespace
export function sanitizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

// Allow only digits — used for mobile number input
export function sanitizeNumeric(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

// Strip any HTML/script tags to prevent stored XSS in notes
export function sanitizeNotes(value: string): string {
  return value
    .trim()
    .replace(/<[^>]*>/g, '')     // strip HTML tags
    .replace(/[<>'"]/g, '')      // strip remaining angle brackets and quotes
    .slice(0, 500);              // hard cap on length
}

// Validate a 10-digit Indian mobile number
export function isValidMobile(value: string): boolean {
  return /^[6-9]\d{9}$/.test(value);
}
