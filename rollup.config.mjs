import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default {
	input: 'src/main.ts',
	output: [
    {
      file: 'dist/bundle.js',
      format: 'iife',
      name: 'WS.SDKMultiActionHack',
    },
    {
      file: 'dist/bundle.min.js',
      format: 'iife',
      name: 'WS.SDKMultiActionHack',
      plugins: [terser()],
    },
  ],
  plugins: [typescript()],
};
