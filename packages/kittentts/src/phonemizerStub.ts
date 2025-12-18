/**
 * Lightweight stub replacement for the phonemizer package.
 * Returns normalized words so KittenTTS can still fall back to tokenized input,
 * while avoiding the heavy Node.js-only streams used by the real phonemizer.
 */
export async function phonemize(text: string, language: string): Promise<string[]> {
  if (!text) return [];

  const normalized = text
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.replace(/[^a-z0-9]/gi, ''))
    .filter(Boolean);

  if (normalized.length === 0) {
    return [''];
  }

  return normalized;
}
