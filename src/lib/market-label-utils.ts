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

  // Clean titles: remove trailing punctuation for comparison
  const cleaned = titles.map(t => t.replace(/[?!.]+$/, '').trim());

  // Word-level suffix matching (80% majority)
  const wordArrays = cleaned.map(t => t.split(/\s+/));
  const threshold = Math.ceil(titles.length * 0.8);
  const minWordCount = Math.min(...wordArrays.map(w => w.length));

  let suffixWords = 0;
  for (let i = 1; i <= minWordCount - 1; i++) {
    const word = wordArrays[0][wordArrays[0].length - i];
    const matches = wordArrays.filter(w => w[w.length - i]?.toLowerCase() === word.toLowerCase()).length;
    if (matches >= threshold) suffixWords = i;
    else break;
  }

  // Word-level prefix matching (strict)
  let prefixWords = 0;
  for (let i = 0; i < minWordCount; i++) {
    const word = wordArrays[0][i];
    if (wordArrays.every(w => w[i]?.toLowerCase() === word.toLowerCase())) prefixWords = i + 1;
    else break;
  }

  // Build title from suffix (preferred) or prefix
  let result = '';

  if (suffixWords >= 2) {
    const suffixPhrase = wordArrays[0].slice(-suffixWords).join(' ');
    result = suffixPhrase.trim();
    // Remove leading verbs/connectors to get the noun phrase
    result = result.replace(/^(will\s+)?(win|reach|hit|make|be|become|get|have|take|go)\s+(the\s+)?/i, '').trim();
    result = result.replace(/^(as the|as|in the|in|of the|of|for the|for|to the|to|be the|be)\s+/i, '').trim();
  }

  if (result.length < 5 && prefixWords >= 2) {
    const prefixPhrase = wordArrays[0].slice(0, prefixWords).join(' ');
    result = prefixPhrase.trim();
    // Remove question starters
    result = result.replace(/^(will|who will|what will|which|how will|when will|where will)\s+/i, '').trim();
    // Remove trailing partial words/articles
    result = result.replace(/\s+(the|a|an|to|in|of|as|be|is)$/i, '').trim();
  }

  // Capitalize
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  // Fallback: use first title cleaned
  if (result.length < 3) {
    let fallback = titles[0].replace(/[?!.]+$/, '').trim();
    fallback = fallback.replace(/^(will|who will|what will|which)\s+/i, '').trim();
    return fallback.charAt(0).toUpperCase() + fallback.slice(1);
  }

  // Add "?" suffix for question-like titles
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
