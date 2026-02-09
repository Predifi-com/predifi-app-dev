/**
 * Utilities for extracting clean labels from grouped market titles.
 */

/**
 * Extract a clean group title from an array of related market titles.
 * e.g. ["Will Trump nominate Judy Shelton as the next Fed chair?", "Will Trump nominate Kevin Warsh as the next Fed chair?"]
 *   → "Next Fed Chair"
 */
export function extractGroupTitle(titles: string[]): string {
  if (titles.length === 0) return '';
  if (titles.length === 1) return titles[0];

  const first = titles[0];

  // Find common prefix
  let prefixLen = 0;
  for (let i = 0; i < first.length; i++) {
    if (titles.every(t => t[i] === first[i])) prefixLen = i + 1;
    else break;
  }

  // Find common suffix
  let suffixLen = 0;
  for (let i = 0; i < first.length - prefixLen; i++) {
    if (titles.every(t => t[t.length - 1 - i] === first[first.length - 1 - i])) suffixLen = i + 1;
    else break;
  }

  // The common suffix is usually the best group title
  // e.g. "as the next Fed chair?" → clean it up
  let suffix = first.slice(first.length - suffixLen).trim();
  suffix = suffix.replace(/^[,\s]+/, '').replace(/[?!.]+$/, '').trim();

  // Remove leading connectors
  suffix = suffix.replace(/^(as the|as|in the|in|of the|of|for the|for|to the|to|be the|be)\s+/i, '').trim();

  // If suffix is too short or empty, try the prefix
  if (suffix.length < 5) {
    let prefix = first.slice(0, prefixLen).trim();
    prefix = prefix.replace(/[,\s?]+$/, '').trim();
    // Remove question starters
    prefix = prefix.replace(/^(will|who will|what will|which|how will|when will|where will)\s+/i, '').trim();
    // Remove trailing partial words
    prefix = prefix.replace(/\s+\S{0,2}$/, '').trim();
    
    if (prefix.length > suffix.length && prefix.length >= 5) {
      suffix = prefix;
    }
  }

  // Capitalize first letter
  if (suffix.length > 0) {
    suffix = suffix.charAt(0).toUpperCase() + suffix.slice(1);
  }

  // Fallback: use first title's question, cleaned
  if (suffix.length < 3) {
    let fallback = first.split('?')[0];
    fallback = fallback.replace(/^(will|who will|what will|which)\s+/i, '').trim();
    return fallback.charAt(0).toUpperCase() + fallback.slice(1);
  }

  return suffix;
}

/**
 * Extract short, unique labels from grouped market titles.
 * Strips common prefix, then trims trailing common phrases.
 */
export function extractUniqueSegments(titles: string[]): string[] {
  if (titles.length <= 1) return titles;
  
  const first = titles[0];
  let prefixLen = 0;
  for (let i = 0; i < first.length; i++) {
    if (titles.every(t => t[i] === first[i])) prefixLen = i + 1;
    else break;
  }

  let segments = titles.map(t => {
    let s = t.slice(prefixLen).trim();
    s = s.replace(/^[,\s?]+/, '').trim();
    return s;
  });

  // Find common suffix among ≥80% of segments (word-level)
  const wordArrays = segments.map(s => s.split(/\s+/));
  const threshold = Math.ceil(segments.length * 0.8);
  const minLen = Math.min(...wordArrays.map(w => w.length));
  let suffixWords = 0;
  for (let i = 1; i <= minLen - 1; i++) {
    const word = wordArrays[0][wordArrays[0].length - i];
    const matches = wordArrays.filter(w => w[w.length - i] === word).length;
    if (matches >= threshold) {
      suffixWords = i;
    } else break;
  }

  if (suffixWords > 0) {
    segments = segments.map(s => {
      const words = s.split(/\s+/);
      const refWords = wordArrays[0];
      const suffixMatch = Array.from({ length: suffixWords }, (_, i) => 
        refWords[refWords.length - 1 - i]
      ).reverse();
      const segEnd = words.slice(-suffixWords);
      if (segEnd.join(' ') === suffixMatch.join(' ')) {
        return words.slice(0, words.length - suffixWords).join(' ');
      }
      return s;
    });
  }

  // Final cleanup
  return segments.map((s, i) => {
    s = s.replace(/[,\s?!.]+$/, '').trim();
    s = s.replace(/\s+(as|in|of|for|to|at|on|by|from|with|the)\s*$/i, '').trim();
    s = s.replace(/\s+(as|in|of|for|to|at|on|by|from|with|the)\s*$/i, '').trim();
    return s || titles[i];
  });
}
