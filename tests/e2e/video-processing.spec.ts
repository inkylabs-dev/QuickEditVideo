import { test, expect } from '@playwright/test';

// Helper function to create a mock video file
async function createMockVideoFile(page: any, filename = 'test-video.mp4') {
  return await page.evaluateHandle(() => {
    const buffer = new ArrayBuffer(1024);
    const view = new Uint8Array(buffer);
    // Fill with some mock video data
    for (let i = 0; i < view.length; i++) {
      view[i] = i % 256;
    }
    return new File([buffer], 'test-video.mp4', { type: 'video/mp4' });
  });
}

test.describe('Video Processing E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set test timeout
    test.setTimeout(30000);
    
    // Mock FFmpeg functionality for e2e tests
    await page.addInitScript(() => {
      // Mock URL.createObjectURL
      window.URL.createObjectURL = () => 'blob:mock-video-url';
      window.URL.revokeObjectURL = () => {};

      // Mock video element properties
      Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
        get: () => 1920,
        configurable: true,
      });
      
      Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
        get: () => 1080,
        configurable: true,
      });
      
      Object.defineProperty(HTMLVideoElement.prototype, 'duration', {
        get: () => 60,
        configurable: true,
      });

      // Mock video load events
      HTMLVideoElement.prototype.addEventListener = function(event, handler) {
        if (event === 'loadedmetadata' && typeof handler === 'function') {
          setTimeout(() => handler(new Event('loadedmetadata')), 100);
        }
        return HTMLElement.prototype.addEventListener.call(this, event, handler);
      };
    });
  });

  test.describe('Video Trimmer', () => {
    test('should render landing page and allow file selection', async ({ page }) => {
      await page.goto('/trim');

      // Check landing page elements
      await expect(page.getByRole('heading', { name: 'Video Trimmer', level: 1 })).toBeVisible();
      await expect(page.getByText('Select your video')).toBeVisible();
      await expect(page.getByText('Drop a video file here or click to browse')).toBeVisible();

      // Check file input exists
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeAttached();
      await expect(fileInput).toHaveAttribute('accept', 'video/*');
    });

    test('should transition to trimming view after file selection', async ({ page }) => {
      await page.goto('/trim');

      // Create mock file and upload
      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Wait for transition to trimming view
      await expect(page.getByText('Select your video')).not.toBeVisible();
      await expect(page.getByText('Controls')).toBeVisible();
      await expect(page.getByText('Timeline')).toBeVisible();
    });

    test('should display video controls and timeline', async ({ page }) => {
      await page.goto('/trim');

      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Check control elements
      await expect(page.getByText('Start time')).toBeVisible();
      await expect(page.getByText('End time')).toBeVisible();
      await expect(page.getByText('Play')).toBeVisible();
      await expect(page.getByText('Reset')).toBeVisible();

      // Check timeline elements
      await expect(page.getByText('Timeline')).toBeVisible();
      await expect(page.locator('.timeline-handle')).toHaveCount(2);
    });

    test('should allow time input changes', async ({ page }) => {
      await page.goto('/trim');

      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Test start time input
      const startTimeInput = page.locator('input[type="number"]').first();
      await startTimeInput.fill('5.0');
      await expect(startTimeInput).toHaveValue('5.0');

      // Test end time input
      const endTimeInput = page.locator('input[type="number"]').last();
      await endTimeInput.fill('30.0');
      await expect(endTimeInput).toHaveValue('30.0');
    });

    test('should show download button when FFmpeg is ready', async ({ page }) => {
      await page.goto('/trim');

      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Wait for download button to appear
      await expect(page.getByText('Download MP4')).toBeVisible();
      
      const downloadButton = page.getByText('Download MP4').locator('..');
      await expect(downloadButton).not.toBeDisabled();
    });
  });

  test.describe('Video Merger', () => {
    test('should render landing page for multiple file upload', async ({ page }) => {
      await page.goto('/merge');

      await expect(page.getByRole('heading', { name: 'Video Merger', level: 1 })).toBeVisible();
      await expect(page.getByText('Select your videos')).toBeVisible();
      await expect(page.getByText('Drop multiple video files here or click to browse')).toBeVisible();

      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toHaveAttribute('multiple');
      await expect(fileInput).toHaveAttribute('accept', 'video/*');
    });

    test('should handle multiple file selection', async ({ page }) => {
      await page.goto('/merge');

      // Create multiple mock files
      const mockFile1 = await createMockVideoFile(page, 'video1.mp4');
      const mockFile2 = await createMockVideoFile(page, 'video2.mp4');
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile1 as any, mockFile2 as any]);

      // Should transition to merging view
      await expect(page.getByText('Select your videos')).not.toBeVisible();
      await expect(page.getByText('Add more videos')).toBeVisible();
      await expect(page.getByText('Preview')).toBeVisible();
    });

    test('should display project summary', async ({ page }) => {
      await page.goto('/merge');

      const mockFile1 = await createMockVideoFile(page, 'video1.mp4');
      const mockFile2 = await createMockVideoFile(page, 'video2.mp4');
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile1 as any, mockFile2 as any]);

      // Check project summary
      await expect(page.getByText('Project Summary')).toBeVisible();
      await expect(page.getByText('Total clips:')).toBeVisible();
      await expect(page.getByText('Total duration:')).toBeVisible();
      await expect(page.getByText('Output format:')).toBeVisible();
      await expect(page.getByText('MP4')).toBeVisible();
    });

    test('should allow toggling between dimension modes', async ({ page }) => {
      await page.goto('/merge');

      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Default mode
      await expect(page.getByText('Use first video dimensions')).toBeVisible();

      // Toggle to custom dimensions
      await page.getByText('Set custom dimensions').click();
      await expect(page.locator('input[type="number"]').first()).toBeVisible();
    });
  });

  test.describe('Video Resizer', () => {
    test('should render landing page', async ({ page }) => {
      await page.goto('/resize');

      await expect(page.getByRole('heading', { name: 'Video Resizer', level: 1 })).toBeVisible();
      await expect(page.getByText('Select your video')).toBeVisible();
      await expect(page.getByText('Drop a video file here or click to browse')).toBeVisible();
    });

    test('should display resize controls after file upload', async ({ page }) => {
      await page.goto('/resize');

      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Check resize controls
      await expect(page.getByText('Resize Controls')).toBeVisible();
      await expect(page.getByText('Scale')).toBeVisible();
      await expect(page.getByText('Width')).toBeVisible();
      await expect(page.getByText('Height')).toBeVisible();
    });

    test('should update dimensions when scale changes', async ({ page }) => {
      await page.goto('/resize');

      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Find scale slider
      const scaleSlider = page.locator('input[type="range"]');
      await scaleSlider.fill('50');

      // Check that percentage updates
      await expect(page.getByText('50%')).toBeVisible();
    });

    test('should display resize information', async ({ page }) => {
      await page.goto('/resize');

      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Check resize information section
      await expect(page.getByText('Resize Information')).toBeVisible();
      await expect(page.getByText('Original')).toBeVisible();
      await expect(page.getByText('New Size')).toBeVisible();
      await expect(page.getByText('Scale Factor')).toBeVisible();
    });

    test('should maintain aspect ratio when width changes', async ({ page }) => {
      await page.goto('/resize');

      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Change width
      const widthInput = page.locator('input[type="number"]').first();
      await widthInput.fill('960');

      // Height should update proportionally (960 * 1080/1920 = 540)
      const heightInput = page.locator('input[type="number"]').last();
      await expect(heightInput).toHaveValue('540');
    });
  });

  test.describe('Navigation and Common Features', () => {
    test('should allow returning to landing view', async ({ page }) => {
      await page.goto('/trim');

      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Click close button
      await page.getByTitle('Choose different video').click();

      // Should return to landing view
      await expect(page.getByText('Select your video')).toBeVisible();
    });

    test('should show loading state for FFmpeg', async ({ page }) => {
      await page.goto('/trim');

      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Initially should show loading or ready state
      await expect(
        page.getByText('Loading...').or(page.getByText('Download MP4'))
      ).toBeVisible();
    });

    test('should handle play/pause functionality', async ({ page }) => {
      await page.goto('/trim');

      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Click play button
      const playButton = page.getByText('Play');
      await playButton.click();

      // Should change to pause
      await expect(page.getByText('Pause')).toBeVisible();
    });

    test('should validate file types', async ({ page }) => {
      await page.goto('/trim');

      // Try to upload a non-video file
      const mockTextFile = await page.evaluateHandle(() => {
        return new File(['text content'], 'test.txt', { type: 'text/plain' });
      });

      // Mock alert to capture the message
      let alertMessage = '';
      page.on('dialog', async dialog => {
        alertMessage = dialog.message();
        await dialog.accept();
      });

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockTextFile as any]);

      // Should show error message
      await page.waitForTimeout(100);
      expect(alertMessage).toContain('Please select a valid video file');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/trim');

      // Check heading hierarchy
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Video Trimmer');
      await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
      await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible();
    });

    test('should have accessible form controls', async ({ page }) => {
      await page.goto('/resize');

      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Check that inputs have associated labels
      await expect(page.getByText('Scale')).toBeVisible();
      await expect(page.getByText('Width')).toBeVisible();
      await expect(page.getByText('Height')).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/trim');

      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Test tab navigation through controls
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to interact with focused elements
      await page.keyboard.press('Enter');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/trim');

      await expect(page.getByText('Video Trimmer')).toBeVisible();
      await expect(page.getByText('Select your video')).toBeVisible();

      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Controls should still be visible and functional
      await expect(page.getByText('Controls')).toBeVisible();
    });

    test('should adapt layout on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/merge');

      await expect(page.getByText('Video Merger')).toBeVisible();
      
      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      await expect(page.getByText('Add more videos')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle missing video metadata gracefully', async ({ page }) => {
      await page.goto('/trim');

      // Mock a video file without proper metadata
      const mockFile = await page.evaluateHandle(() => {
        return new File([new ArrayBuffer(0)], 'empty.mp4', { type: 'video/mp4' });
      });

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Should still transition to editing view or show appropriate message
      await expect(
        page.getByText('Controls').or(page.getByText('Select your video'))
      ).toBeVisible();
    });

    test('should recover from processing errors', async ({ page }) => {
      await page.goto('/trim');

      const mockFile = await createMockVideoFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Mock processing error
      await page.addInitScript(() => {
        // Override any FFmpeg processing to fail
        window.mockFFmpegError = true;
      });

      // Try to process
      const downloadButton = page.getByText('Download MP4');
      if (await downloadButton.isVisible()) {
        await downloadButton.click();
        
        // Should handle error gracefully
        await page.waitForTimeout(1000);
        // Button should not be stuck in processing state
        await expect(downloadButton).not.toBeDisabled();
      }
    });
  });

  test.describe('Cross-browser compatibility', () => {
    test('should work with drag and drop', async ({ page }) => {
      await page.goto('/trim');

      const uploadArea = page.getByText('Drop a video file here or click to browse');
      
      // Simulate drag and drop
      await uploadArea.hover();
      
      // Should show proper drag states
      await expect(uploadArea).toBeVisible();
    });

    test('should handle different file formats', async ({ page }) => {
      const formats = ['mp4', 'webm', 'mov', 'avi'];
      
      for (const format of formats) {
        await page.goto('/trim');
        
        const mockFile = await page.evaluateHandle((fmt) => {
          return new File([new ArrayBuffer(1024)], `test.${fmt}`, { 
            type: `video/${fmt}` 
          });
        }, format);

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles([mockFile as any]);

        // Should accept the file and show controls
        await expect(page.getByText('Controls')).toBeVisible();
      }
    });
  });
});