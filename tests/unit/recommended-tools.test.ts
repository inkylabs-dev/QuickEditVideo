import { describe, it, expect } from 'vitest';
import { getToolById, getAllTools } from '../../src/constants/tools';

describe('Recommended Tools Feature', () => {
  it('should have recommendedTools field for extract-audio tool', () => {
    const extractAudioTool = getToolById('extract-audio');
    
    expect(extractAudioTool).toBeDefined();
    expect(extractAudioTool?.recommendedTools).toBeDefined();
    expect(extractAudioTool?.recommendedTools).toContain('tts');
  });

  it('should have recommendedTools field for extract-frame tool', () => {
    const extractFrameTool = getToolById('extract-frame');
    
    expect(extractFrameTool).toBeDefined();
    expect(extractFrameTool?.recommendedTools).toBeDefined();
    expect(extractFrameTool?.recommendedTools).toContain('tts');
  });

  it('should have recommendedTools field for tts tool', () => {
    const ttsTool = getToolById('tts');
    
    expect(ttsTool).toBeDefined();
    expect(ttsTool?.recommendedTools).toBeDefined();
    expect(ttsTool?.recommendedTools).toContain('extract-audio');
    expect(ttsTool?.recommendedTools).toContain('extract-frame');
  });

  it('should have recommendedTools field for trim tool', () => {
    const trimTool = getToolById('trim');
    
    expect(trimTool).toBeDefined();
    expect(trimTool?.recommendedTools).toBeDefined();
    expect(trimTool?.recommendedTools).toContain('merge');
    expect(trimTool?.recommendedTools).toContain('crop');
    expect(trimTool?.recommendedTools).toContain('resize');
  });

  it('should ensure all recommendedTools reference valid tool IDs', () => {
    const allTools = getAllTools();
    const allToolIds = allTools.map(tool => tool.id);

    allTools.forEach(tool => {
      if (tool.recommendedTools) {
        tool.recommendedTools.forEach(recommendedId => {
          expect(allToolIds).toContain(recommendedId);
        });
      }
    });
  });

  it('should not have self-referencing recommendations', () => {
    const allTools = getAllTools();

    allTools.forEach(tool => {
      if (tool.recommendedTools) {
        expect(tool.recommendedTools).not.toContain(tool.id);
      }
    });
  });

  it('should have relevant cross-category recommendations', () => {
    // Test that extract-audio (audio-quality) recommends tts (audio-quality)
    const extractAudioTool = getToolById('extract-audio');
    expect(extractAudioTool?.recommendedTools).toContain('tts');
    
    // Test that crop (video-editing) recommends resize (video-editing)
    const cropTool = getToolById('crop');
    expect(cropTool?.recommendedTools).toContain('resize');
    
    // Test that to-mp4 (converters) recommends trim (video-editing)
    const toMp4Tool = getToolById('to-mp4');
    expect(toMp4Tool?.recommendedTools).toContain('trim');
  });
});
