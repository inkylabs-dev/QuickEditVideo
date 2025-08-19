#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source and destination directories
const sourceDir = path.join(__dirname, '..', 'node_modules', 'onnxruntime-web', 'dist');
const onnxDir = path.join(__dirname, '..', 'public', 'onnx');

// Create public/onnx directory if it doesn't exist
if (!fs.existsSync(onnxDir)) {
  fs.mkdirSync(onnxDir, { recursive: true });
  console.log('📁 Created public/onnx directory');
}

// ONNX Runtime WASM files to copy
const wasmFiles = [
  'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd-threaded.jsep.wasm'
];

// JS files that might be needed
const jsFiles = [
  'ort.wasm.min.js'
];

async function copyFile(source, destination, description) {
  try {
    if (!fs.existsSync(source)) {
      console.log(`⚠️  Warning: ${description} not found at ${source}`);
      return false;
    }

    fs.copyFileSync(source, destination);
    const stats = fs.statSync(destination);
    console.log(`✅ Copied ${description} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to copy ${description}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Copying ONNX Runtime WASM files from node_modules...');
  
  let successCount = 0;
  let totalFiles = 0;

  // Copy WASM files
  for (const filename of wasmFiles) {
    totalFiles++;
    const source = path.join(sourceDir, filename);
    const destination = path.join(onnxDir, filename);
    
    if (await copyFile(source, destination, filename)) {
      successCount++;
    }
  }

  // Copy JS files
  for (const filename of jsFiles) {
    totalFiles++;
    const source = path.join(sourceDir, filename);
    const destination = path.join(onnxDir, filename);
    
    if (await copyFile(source, destination, filename)) {
      successCount++;
    }
  }

  // Also create simplified filenames for compatibility
  const compatibilityMappings = [
    { from: 'ort-wasm-simd-threaded.wasm', to: 'ort-wasm.wasm' },
    { from: 'ort-wasm-simd-threaded.wasm', to: 'ort-wasm-threaded.wasm' },
    { from: 'ort-wasm-simd-threaded.wasm', to: 'ort-wasm-simd.wasm' }
  ];

  for (const mapping of compatibilityMappings) {
    const source = path.join(onnxDir, mapping.from);
    const destination = path.join(onnxDir, mapping.to);
    
    if (fs.existsSync(source) && !fs.existsSync(destination)) {
      fs.copyFileSync(source, destination);
      console.log(`🔗 Created compatibility link: ${mapping.to}`);
    }
  }
  
  console.log(`\n🎉 Successfully copied ${successCount}/${totalFiles} ONNX Runtime files!`);
  console.log('📁 Files located in: public/onnx/');
  
  // List final files
  if (fs.existsSync(onnxDir)) {
    const files = fs.readdirSync(onnxDir);
    console.log('\n📄 Available files:');
    for (const file of files) {
      const filePath = path.join(onnxDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   ${file} (${(stats.size / 1024).toFixed(0)} KB)`);
    }
  }
}

// Run the main function if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };