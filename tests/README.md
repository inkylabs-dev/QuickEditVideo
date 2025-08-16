# Testing Guide

This document describes the testing setup for QuickEditVideo, which uses both unit tests (Vitest) and end-to-end tests (Playwright).

## Overview

The project uses a two-tier testing approach:
- **Unit Tests** - Fast tests for components, utilities, and page content using Vitest
- **E2E Tests** - Critical user flow tests using Playwright for browser automation, usually only test basic page loading and essential video processing & downloading with some attribute changes.

## Test Structure

### Unit Tests (Vitest)
- `tests/unit/components/` - Component unit tests
- `tests/unit/pages/` - Page content and SEO tests
- `tests/setup.ts` - Test setup and configuration

### E2E Tests (Playwright)
- `tests/e2e/home.spec.js` - Tests for the homepage functionality
- `tests/e2e/trim.spec.js` - Tests for the video trimmer page
- `tests/e2e/crop.spec.js` - Tests for the video cropper page
- `tests/e2e/merge.spec.js` - Tests for the video merger page  
- `tests/e2e/resize.spec.js` - Tests for the video resizer page
- `tests/e2e/to-mp4.spec.js` - Tests for the MP4 converter page
- `tests/e2e/to-avi.spec.js` - Tests for the AVI converter page
- `tests/e2e/to-mov.spec.js` - Tests for the MOV converter page
- `tests/e2e/to-mkv.spec.js` - Tests for the MKV converter page
- `tests/e2e/to-webm.spec.js` - Tests for the WebM converter page
- `tests/e2e/to-gif.spec.js` - Tests for the GIF converter page

## Test Coverage

### Unit Tests Cover:
1. **Component Logic** - VideoConverter component behavior and props
2. **Format Detection** - Proper handling of different video formats
3. **Page Content** - SEO meta tags, titles, descriptions, and keywords
4. **Content Structure** - Quick guide steps, benefits, and supported formats
5. **Utility Functions** - Time formatting, format detection, and MIME types

### E2E Tests Cover:
1. **Page Loading** - Verifies pages load with correct titles and basic structure
2. **Video Conversion Flow** - Complete upload → convert → download workflow
3. **File Downloads** - Validates downloaded files have correct extensions and content
4. **Format-Specific UI** - Ensures correct target format is displayed during conversion

## Running Tests

### Run All Tests
```bash
npm test
```

### Unit Tests Only
```bash
# Run once
npm run test:unit

# Watch mode for development
npm run test:unit:watch

# UI mode for interactive testing
npm run test:unit:ui
```

### E2E Tests Only
```bash
# Run all E2E tests
npm run test:e2e

# Interactive mode
npm run test:e2e:ui
```

### Run Specific Tests
```bash
# Specific unit test file
npx vitest tests/unit/components/VideoConverter.test.tsx

# Specific E2E test file
npx playwright test tests/e2e/to-mp4.spec.js

# All converter E2E tests
npx playwright test tests/e2e/to-*.spec.js

# Single browser for E2E
npx playwright test --project=chromium
```

## Test Philosophy

### Unit Tests (Fast, Isolated)
- **Component Behavior** - Test component logic without browser dependencies
- **Content Validation** - Verify page content, SEO tags, and structure
- **Pure Functions** - Test utility functions and format detection
- **Mock Dependencies** - Mock FFmpeg, DOM APIs, and external dependencies

### E2E Tests (Slow, Realistic)
- **Critical User Flows** - Only test the most important user journeys
- **Page Load Verification** - Ensure pages load and display correctly
- **Video Conversion Process** - Complete workflow from upload to download
- **File Validation** - Verify actual file conversion and download functionality

## Configuration

### Vitest Configuration (`vitest.config.ts`)
- Uses jsdom environment for DOM testing
- Preact rendering support
- Global test utilities
- CSS support for component testing

### Playwright Configuration (`playwright.config.js`)
- Tests run against `http://localhost:4321`
- Uses `npm run preview` as the web server
- Cross-browser testing (Chromium, Firefox, WebKit)
- CI/CD optimized

## Development Workflow

### When Writing Features
1. **Start with Unit Tests** - Write component and logic tests first
2. **Add E2E Coverage** - Add minimal E2E tests for new user flows
3. **Run Tests Frequently** - Use watch mode during development

### Before Committing
```bash
# Run all tests
npm test

# Build to ensure everything works
npm run build
```

### CI/CD Pipeline
- Unit tests run first (fast feedback)
- E2E tests run after build (comprehensive validation)
- Tests run on multiple browsers and environments

## Troubleshooting

### Unit Test Issues
- **Component Not Rendering** - Check imports and mock setup
- **DOM Queries Failing** - Ensure jsdom environment is configured
- **Mock Issues** - Verify mocks in `tests/setup.ts`

### E2E Test Issues
- **Timeouts** - Increase timeout for video loading/conversion
- **File Upload Failures** - Check test video file exists in `tests/e2e/static/`
- **Download Issues** - Ensure download handlers are properly set up

### Performance
- **Unit Tests** - Should run in milliseconds, mock heavy dependencies
- **E2E Tests** - Expected to be slower, focus on critical paths only
- **CI Optimization** - Use `--reporter=line` for cleaner CI output

This testing strategy ensures fast feedback during development while maintaining confidence in the complete user experience.