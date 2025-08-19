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

    console.log('TextCleaner initialized with', symbols.length, 'symbols');
  }

  /**
   * Main method that converts text to token indices
   * @param text Input text to convert
   * @returns Array of token indices
   */
  call(text: string): number[] {
    console.log('TextCleaner processing text:', text);
    const indexes: number[] = [];
    
    for (const char of text) {
      if (this.wordIndexDictionary[char] !== undefined) {
        indexes.push(this.wordIndexDictionary[char]);
        console.log(`Mapped '${char}' -> ${this.wordIndexDictionary[char]}`);
      } else {
        console.warn(`Unknown character '${char}', skipping`);
        // Skip unknown characters (matching Python implementation)
      }
    }
    
    console.log('TextCleaner result:', indexes);
    return indexes;
  }

  /**
   * Helper method for backwards compatibility
   * @param text Text to clean
   * @returns Cleaned text
   */
  clean(text: string): string {
    // Basic text normalization
    return text.replace(/\s+/g, ' ').trim();
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