import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';

export default [
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json'
      }),
      copy({
        targets: [
          { src: 'assets/kitten_tts_nano_v0_1.onnx', dest: 'dist/assets', rename: 'model.onnx' },
          { src: 'assets/voices.json', dest: 'dist/assets' },
          { src: 'assets/config.json', dest: 'dist/assets' }
        ],
        verbose: true,
        copyOnce: true
      })
    ],
    external: ['onnxruntime-web', 'phonemizer']
  },
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json'
      }),
      copy({
        targets: [
          { src: 'assets/kitten_tts_nano_v0_1.onnx', dest: 'dist/assets', rename: 'model.onnx' },
          { src: 'assets/voices.json', dest: 'dist/assets' },
          { src: 'assets/config.json', dest: 'dist/assets' }
        ],
        verbose: true,
        copyOnce: true
      })
    ],
    external: ['onnxruntime-web', 'phonemizer']
  }
];