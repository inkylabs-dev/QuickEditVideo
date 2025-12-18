import { describe, it, expect } from 'vitest';
import { formatDuration, formatFileSize, formatBitrate } from '../../src/utils/formatters';

describe('formatDuration', () => {
  it('renders seconds under a minute', () => {
    expect(formatDuration(42)).toBe('0:42');
  });

  it('renders minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2:05');
  });

  it('renders hours when necessary', () => {
    expect(formatDuration(3_900)).toBe('1:05:00');
  });

  it('returns Unknown for invalid values', () => {
    expect(formatDuration(undefined)).toBe('Unknown');
    expect(formatDuration('bad')).toBe('Unknown');
  });
});

describe('formatFileSize', () => {
  it('formats bytes into KB and higher units', () => {
    expect(formatFileSize(800)).toBe('800 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(3_145_728)).toBe('3.0 MB');
  });

  it('returns Unknown for bad input', () => {
    expect(formatFileSize(null)).toBe('Unknown');
    expect(formatFileSize('oops')).toBe('Unknown');
  });
});

describe('formatBitrate', () => {
  it('formats large bitrates into Mbps', () => {
    expect(formatBitrate(2_000_000)).toBe('2.0 Mbps');
  });

  it('formats smaller bitrates into kbps', () => {
    expect(formatBitrate(1500)).toBe('2 kbps');
  });

  it('handles base units and invalid data', () => {
    expect(formatBitrate(600)).toBe('600 bps');
    expect(formatBitrate(undefined)).toBe('Unknown');
  });
});
