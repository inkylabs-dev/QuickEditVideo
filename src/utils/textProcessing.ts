/**
 * Text processing utilities for TTS with pause support
 */

/**
 * Split text into segments based on newlines and [pause] markers
 * @param text Input text to split
 * @returns Array of text segments for individual TTS generation
 */
export function splitTextForPauses(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // First split by [pause] markers (case insensitive)
  const pauseSegments = text.split(/\[pause\]/gi);
  
  // Then split each segment by newlines
  const allSegments: string[] = [];
  
  for (const segment of pauseSegments) {
    // Split by newlines and filter out empty segments
    const lineSegments = segment
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    allSegments.push(...lineSegments);
  }
  
  return allSegments.filter(segment => segment.length > 0);
}

/**
 * Check if text contains pause markers (newlines or [pause])
 * @param text Input text to check
 * @returns true if text contains pause markers
 */
export function hasPauseMarkers(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  return text.includes('\n') || /\[pause\]/gi.test(text);
}