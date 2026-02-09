/**
 * Utilities for market date/expiry detection and display.
 */

const currentYear = new Date().getFullYear();

/**
 * Try to extract a specific date from a market title.
 * Matches patterns like "on Feb 7", "by March 31, 2026", "in February 2026", etc.
 */
export function extractDateFromTitle(title: string): Date | null {
  // "on Feb 7" / "on February 7, 2026" / "by March 31"
  const datePatterns = [
    // "on Feb 7, 2026" or "by March 31, 2026"
    /\b(?:on|by|before|after)\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:,?\s*(\d{4}))?\b/i,
    // "February 7, 2026" standalone
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:,?\s*(\d{4}))?\b/i,
  ];

  for (const pattern of datePatterns) {
    const match = title.match(pattern);
    if (match) {
      const month = match[1];
      const day = parseInt(match[2], 10);
      const year = match[3] ? parseInt(match[3], 10) : currentYear;
      const dateStr = `${month} ${day}, ${year}`;
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        // Set to end of day
        parsed.setHours(23, 59, 59, 999);
        return parsed;
      }
    }
  }

  return null;
}

/**
 * Determine the best end date for a market.
 * Priority: resolution_date > expires_at > title-extracted date
 * Also considers if a market is "effectively resolved" (price at 99%+).
 */
export function getEffectiveEndDate(market: {
  resolution_date?: string | null;
  expires_at?: string;
  title: string;
  yes_price?: number;
  no_price?: number;
}): string | null {
  // If resolution_date exists, use it
  if (market.resolution_date) return market.resolution_date;

  // Try to extract date from title
  const titleDate = extractDateFromTitle(market.title);

  // If expires_at exists, compare with title date
  if (market.expires_at) {
    const expiresAt = new Date(market.expires_at);
    // If title has a date and it's earlier than expires_at, prefer title date
    // This handles cases where expires_at is a grace period
    if (titleDate && titleDate.getTime() < expiresAt.getTime()) {
      return titleDate.toISOString();
    }
    return market.expires_at;
  }

  // Fallback to title date
  if (titleDate) return titleDate.toISOString();

  return null;
}

/**
 * Check if a market appears to be effectively resolved/ended.
 * A market is considered resolved if:
 * - Its yes_price >= 99 or no_price >= 99 (price at extreme)
 * - AND the event date has passed
 */
export function isEffectivelyResolved(market: {
  title: string;
  yes_price?: number;
  no_price?: number;
  resolution_date?: string | null;
  expires_at?: string;
  status?: string;
}): boolean {
  if (market.status === 'resolved' || market.status === 'expired') return true;

  const endDate = getEffectiveEndDate(market);
  if (!endDate) return false;

  const now = Date.now();
  const end = new Date(endDate).getTime();

  // If end date has passed
  if (end < now) {
    return true;
  }

  // If price is at extreme AND the title contains a past date
  const yp = market.yes_price ?? 50;
  const np = market.no_price ?? 50;
  if ((yp >= 99 || np >= 99)) {
    const titleDate = extractDateFromTitle(market.title);
    if (titleDate && titleDate.getTime() < now) {
      return true;
    }
  }

  return false;
}
