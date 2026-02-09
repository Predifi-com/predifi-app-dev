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

  // Find common prefix (character-level, strict)
  let prefixLen = 0;
  for (let i = 0; i < first.length; i++) {
    if (titles.every(t => t[i] === first[i])) prefixLen = i + 1;
    else break;
  }

  // Find common suffix using 80% majority (tolerates outliers like "no one before 2027")
  const threshold = Math.ceil(titles.length * 0.8);
  let suffixLen = 0;
  for (let i = 0; i < first.length - prefixLen; i++) {
    const ch = first[first.length - 1 - i];
    const matches = titles.filter(t => t[t.length - 1 - i] === ch).length;
    if (matches >= threshold) suffixLen = i + 1;
    else break;
  }

  // Try suffix first — it's usually the semantic group name
  let result = '';
  if (suffixLen > 3) {
    result = first.slice(first.length - suffixLen).trim();
    result = result.replace(/^[,\s]+/, '').replace(/[?!.]+$/, '').trim();
    // Remove leading connectors
    result = result.replace(/^(as the|as|in the|in|of the|of|for the|for|to the|to|be the|be|win the|win)\s+/i, '').trim();
  }

  // If suffix too short, try prefix
  if (result.length < 5) {
    let prefix = first.slice(0, prefixLen).trim();
    prefix = prefix.replace(/[,\s?]+$/, '').trim();
    prefix = prefix.replace(/^(will|who will|what will|which|how will|when will|where will)\s+/i, '').trim();
    prefix = prefix.replace(/\s+\S{0,2}$/, '').trim();
    if (prefix.length > result.length && prefix.length >= 5) {
      result = prefix;
    }
  }

  // Capitalize first letter
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  // Fallback: use first title's question, cleaned
  if (result.length < 3) {
    let fallback = first.split('?')[0];
    fallback = fallback.replace(/^(will|who will|what will|which)\s+/i, '').trim();
    return fallback.charAt(0).toUpperCase() + fallback.slice(1);
  }

  return result;
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
