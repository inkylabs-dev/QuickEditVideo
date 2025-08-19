#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create public/tts directory if it doesn't exist
const ttsDir = path.join(__dirname, '..', 'public', 'tts');
if (!fs.existsSync(ttsDir)) {
  fs.mkdirSync(ttsDir, { recursive: true });
  console.log('📁 Created public/tts directory');
}

// Model files to download
const files = [
  {
    url: 'https://huggingface.co/KittenML/kitten-tts-nano-0.1/resolve/main/kitten_tts_nano_v0_1.onnx',
    filename: 'kitten_tts_nano_v0_1.onnx',
    description: 'KittenTTS ONNX model'
  },
  {
    url: 'https://huggingface.co/KittenML/kitten-tts-nano-0.1/resolve/main/voices.npz',
    filename: 'voices.npz',
    description: 'Voice embeddings (NumPy format)'
  },
  {
    url: 'https://huggingface.co/KittenML/kitten-tts-nano-0.1/resolve/main/config.json',
    filename: 'config.json',
    description: 'Model configuration'
  }
];

async function downloadFile(url, filepath, description) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading ${description}...`);
    
    const file = fs.createWriteStream(filepath);
    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        console.log(`🔄 Redirecting to: ${redirectUrl}`);
        https.get(redirectUrl, (redirectResponse) => {
          const totalSize = parseInt(redirectResponse.headers['content-length'] || '0', 10);
          let downloadedSize = 0;
          
          redirectResponse.pipe(file);
          
          redirectResponse.on('data', (chunk) => {
            downloadedSize += chunk.length;
            if (totalSize > 0) {
              const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
              process.stdout.write(`\r   Progress: ${percent}%`);
            }
          });
          
          redirectResponse.on('end', () => {
            console.log(`\n✅ Downloaded ${description}`);
            resolve();
          });
          
          redirectResponse.on('error', reject);
        }).on('error', reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'] || '0', 10);
      let downloadedSize = 0;
      
      response.pipe(file);
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize > 0) {
          const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`\r   Progress: ${percent}%`);
        }
      });
      
      response.on('end', () => {
        console.log(`\n✅ Downloaded ${description}`);
        resolve();
      });
      
      response.on('error', reject);
    });
    
    request.on('error', reject);
    
    file.on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

async function main() {
  console.log('🚀 Starting KittenTTS model download...');
  
  try {
    for (const file of files) {
      const filepath = path.join(ttsDir, file.filename);
      
      // Skip if file already exists
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        console.log(`⏭️  Skipping ${file.description} (already exists, ${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
        continue;
      }
      
      await downloadFile(file.url, filepath, file.description);
      
      // Show file size
      const stats = fs.statSync(filepath);
      console.log(`   File size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
    }
    
    console.log('\n🎉 All TTS model files downloaded successfully!');
    console.log('📁 Files located in: public/tts/');
    
  } catch (error) {
    console.error('\n❌ Error downloading files:', error.message);
    process.exit(1);
  }
}

// Run the main function if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };