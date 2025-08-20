/**
 * Core text cleaning function for TTS processing
 * @param text Input text to clean
 * @returns Cleaned text suitable for TTS
 */
export function cleanTextForTTS(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove emojis using Unicode ranges
  // This regex covers most common emoji ranges
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{200D}]/gu;

  const cleanedText = text.replace(emojiRegex, '')
    .replace(/\b\/\b/, ' slash ')
    .replace(/[\/\\()¯]/g, '')
    .replace(/["""]/g, '')
    .replace(/\s—/g, '.')
    .replace(/\b_\b/g, ' ')
    .replace(/\b-\b/g, ' ')
    // Remove non-Latin characters (keep basic Latin, Latin Extended, numbers, punctuation, and whitespace)
    .replace(/[^\u0000-\u024F]/g, '');

  return cleanedText.trim();
}

export function chunkText(text: string): string[] {
    if (!text || typeof text !== 'string') {
        return [];
    }

    const MIN_CHUNK_LENGTH = 4;
    const MAX_CHUNK_LENGTH = 500;

    // First, split by newlines
    const lines = text.split('\n');
    const chunks = [];

    for (const line of lines) {
        // Skip empty lines
        if (line.trim() === '') continue;

        // Check if the line already ends with punctuation
        const endsWithPunctuation = /[.!?]$/.test(line.trim());

        // If it doesn't end with punctuation and it's not empty, add a period
        const processedLine = endsWithPunctuation ? line : line.trim() + '.';

        // Now split the line into sentences based on punctuation followed by whitespace or end of line
        // Using regex with positive lookbehind and lookahead to keep punctuation with the sentence
        // Avoid splitting on abbreviations like "i.e.", "e.g.", "Mr.", "Dr.", etc.
        const sentences = processedLine.split(/(?<=[.!?])(?=\s+[A-Z]|$)/);

        // Process sentences and combine short ones
        let currentChunk = '';

        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;

            // If this sentence alone exceeds max length, split it at word boundaries
            if (trimmedSentence.length > MAX_CHUNK_LENGTH) {
                // Add current chunk if exists
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = '';
                }

                // Split long sentence at word boundaries
                const words = trimmedSentence.split(' ');
                let longChunk = '';

                for (const word of words) {
                    const potentialLongChunk = longChunk + (longChunk ? ' ' : '') + word;
                    if (potentialLongChunk.length <= MAX_CHUNK_LENGTH) {
                        longChunk = potentialLongChunk;
                    } else {
                        if (longChunk) {
                            chunks.push(longChunk);
                        }
                        longChunk = word;
                    }
                }

                if (longChunk) {
                    currentChunk = longChunk;
                }
                continue;
            }

            // If adding this sentence would exceed max length, finalize current chunk
            const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + trimmedSentence;

            if (potentialChunk.length > MAX_CHUNK_LENGTH) {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                currentChunk = trimmedSentence;
            } else if (potentialChunk.length < MIN_CHUNK_LENGTH) {
                currentChunk = potentialChunk;
            } else {
                // Chunk is between min and max length - keep building it
                currentChunk = potentialChunk;
            }
        }

        // Add any remaining chunk
        if (currentChunk) {
            chunks.push(currentChunk);
        }
    }

    return chunks;
}

/**
 * TextCleaner class for converting text to token indices
 * Matches the Python KittenTTS implementation
 */
export class TextCleaner {
  private wordIndexDictionary: Record<string, number>;

  constructor() {
    const _pad = "$";
    const _punctuation = ';:,.!?¡¿—…"«»"" ';
    const _letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const _letters_ipa = "ɑɐɒæɓʙβɔɕçɗɖðʤəɘɚɛɜɝɞɟʄɡɠɢʛɦɧħɥʜɨɪʝɭɬɫɮʟɱɯɰŋɳɲɴøɵɸθœɶʘɹɺɾɻʀʁɽʂʃʈʧʉʊʋⱱʌɣɤʍχʎʏʑʐʒʔʡʕʢǀǁǂǃˈˌːˑʼʴʰʱʲʷˠˤ˞↓↑→↗↘'̩'ᵻ";

    const symbols = [_pad, ...Array.from(_punctuation), ...Array.from(_letters), ...Array.from(_letters_ipa)];
    
    this.wordIndexDictionary = {};
    for (let i = 0; i < symbols.length; i++) {
      this.wordIndexDictionary[symbols[i]] = i;
    }

    // console.log('TextCleaner initialized with', symbols.length, 'symbols');
  }

  /**
   * Main method that converts text to token indices
   * @param text Input text to convert
   * @returns Array of token indices
   */
  call(text: string): number[] {
    // console.log('TextCleaner processing text:', text);
    const indexes: number[] = [];
    
    for (const char of text) {
      if (this.wordIndexDictionary[char] !== undefined) {
        indexes.push(this.wordIndexDictionary[char]);
        // console.log(`Mapped '${char}' -> ${this.wordIndexDictionary[char]}`);
      } else {
        console.warn(`Unknown character '${char}', skipping`);
        // Skip unknown characters (matching Python implementation)
      }
    }
    
    // console.log('TextCleaner result:', indexes);
    return indexes;
  }

  /**
   * Helper method for backwards compatibility
   * @param text Text to clean
   * @returns Cleaned text
   */
  clean(text: string): string {
    return cleanTextForTTS(text);
  }

  /**
   * Convert text directly to BigInt64Array for ONNX model
   * @param text Input text
   * @returns BigInt64Array of token IDs
   */
  textToTokens(text: string): BigInt64Array {
    const indexes = this.call(text);
    return new BigInt64Array(indexes.map((id: number) => BigInt(id)));
  }

  /**
   * Get the symbol dictionary for debugging
   * @returns Copy of the word index dictionary
   */
  getSymbolDictionary(): Record<string, number> {
    return { ...this.wordIndexDictionary };
  }
}

// Text splitting stream to break text into chunks
export class TextSplitterStream {
  private chunks: string[];
  private closed: boolean;

  constructor() {
    this.chunks = [];
    this.closed = false;
  }

  chunkText(text: string): string[] {
    // Clean the text first, then chunk it
    const cleanedText = cleanTextForTTS(text);
    return chunkText(cleanedText);
  }

  push(text: string): void {
    if (this.closed) {
      throw new Error('Cannot push to a closed TextSplitterStream');
    }
    // Simple sentence splitting for now
    const sentences = this.chunkText(text) || [text];
    this.chunks.push(...sentences);
  }

  close(): void {
    this.closed = true;
  }

  isClosed(): boolean {
    return this.closed;
  }

  getChunks(): string[] {
    return [...this.chunks];
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<string, void, unknown> {
    for (const chunk of this.chunks) {
      yield chunk;
    }
  }
}