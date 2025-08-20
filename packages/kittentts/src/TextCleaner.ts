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