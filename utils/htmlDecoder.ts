// HTML Entity Decoder Utility
export const decodeHtmlEntities = (text: string): string => {
  if (!text || typeof text !== 'string') return text;

  // HTML entity mapping
  const entityMap: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&euro;': '€',
    '&pound;': '£',
    '&yen;': '¥',
    '&cent;': '¢',
    '&sect;': '§',
    '&para;': '¶',
    '&middot;': '·',
    '&laquo;': '«',
    '&raquo;': '»',
    '&iquest;': '¿',
    '&iexcl;': '¡',
    '&deg;': '°',
    '&plusmn;': '±',
    '&sup2;': '²',
    '&sup3;': '³',
    '&frac14;': '¼',
    '&frac12;': '½',
    '&frac34;': '¾',
    '&times;': '×',
    '&divide;': '÷',
    '&ndash;': '–',
    '&mdash;': '—',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&hellip;': '…',
    '&prime;': '′',
    '&Prime;': '″',
    '&lsaquo;': '‹',
    '&rsaquo;': '›',
    '&oline;': '‾',
    '&frasl;': '⁄',
    '&weierp;': '℘',
    '&image;': 'ℑ',
    '&real;': 'ℜ',
    '&alefsym;': 'ℵ',
    '&larr;': '←',
    '&uarr;': '↑',
    '&rarr;': '→',
    '&darr;': '↓',
    '&harr;': '↔',
    '&crarr;': '↵',
    '&lArr;': '⇐',
    '&uArr;': '⇑',
    '&rArr;': '⇒',
    '&dArr;': '⇓',
    '&hArr;': '⇔',
    '&forall;': '∀',
    '&part;': '∂',
    '&exist;': '∃',
    '&empty;': '∅',
    '&nabla;': '∇',
    '&isin;': '∈',
    '&notin;': '∉',
    '&ni;': '∋',
    '&prod;': '∏',
    '&sum;': '∑',
    '&minus;': '−',
    '&lowast;': '∗',
    '&radic;': '√',
    '&prop;': '∝',
    '&infin;': '∞',
    '&ang;': '∠',
    '&and;': '∧',
    '&or;': '∨',
    '&cap;': '∩',
    '&cup;': '∪',
    '&int;': '∫',
    '&there4;': '∴',
    '&sim;': '∼',
    '&cong;': '≅',
    '&asymp;': '≈',
    '&ne;': '≠',
    '&equiv;': '≡',
    '&le;': '≤',
    '&ge;': '≥',
    '&sub;': '⊂',
    '&sup;': '⊃',
    '&nsub;': '⊄',
    '&sube;': '⊆',
    '&supe;': '⊇',
    '&oplus;': '⊕',
    '&otimes;': '⊗',
    '&perp;': '⊥',
    '&sdot;': '⋅',
  };

  let decodedText = text;

  // Replace named entities
  Object.keys(entityMap).forEach(entity => {
    const regex = new RegExp(entity, 'g');
    decodedText = decodedText.replace(regex, entityMap[entity]);
  });

  // Replace numeric entities (decimal) like &#39; &#8217; etc.
  decodedText = decodedText.replace(/&#(\d+);/g, (match, dec) => {
    const charCode = parseInt(dec, 10);
    return String.fromCharCode(charCode);
  });

  // Replace hexadecimal entities like &#x27; &#x2019; etc.
  decodedText = decodedText.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    const charCode = parseInt(hex, 16);
    return String.fromCharCode(charCode);
  });

  return decodedText;
};

// Helper function to clean and decode text (combines HTML tag removal and entity decoding)
export const cleanAndDecodeText = (text: string): string => {
  if (!text || typeof text !== 'string') return text;

  // First remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, '');
  
  // Then decode HTML entities
  cleaned = decodeHtmlEntities(cleaned);
  
  // Trim whitespace
  return cleaned.trim();
}; 