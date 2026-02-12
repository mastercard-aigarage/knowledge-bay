export function toTitleCase(input: string): string {
  const value = input.trim();
  if (!value) return value;

  // Normalize to lower case first so ALL-CAPS locations become readable.
  const lower = value.toLowerCase();

  // Title-case each word while preserving short acronyms like "USA", "UK", "NY".
  // Keeps punctuation (commas, slashes, hyphens) reasonably intact.
  return lower
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token)) return token;

      // Split on hyphens/slashes but keep the delimiters.
      return token
        .split(/([-\/])/)
        .map((part) => {
          if (part === '-' || part === '/') return part;

          // Handle simple punctuation around the word.
          const match = part.match(/^([^a-z0-9]*)([a-z0-9]+)([^a-z0-9]*)$/i);
          if (!match) return part;
          const [, leading, core, trailing] = match;

          // Preserve common short acronyms (after lowering, so re-uppercase them).
          if (core.length <= 3 && /^[a-z]+$/i.test(core)) {
            const upper = core.toUpperCase();
            if (upper === 'USA' || upper === 'UK' || upper === 'UAE' || upper === 'EU' || upper === 'NY' || upper === 'CA') {
              return `${leading}${upper}${trailing}`;
            }
          }

          const c = core;
          return `${leading}${c.charAt(0).toUpperCase()}${c.slice(1)}${trailing}`;
        })
        .join('');
    })
    .join('');
}
