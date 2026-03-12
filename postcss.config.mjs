import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import autoprefixer from 'autoprefixer';
import babelLoader from './babel.config.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const rsdPostcssPlugin = require(
  require.resolve('react-strict-dom/postcss-plugin', {
    paths: [
      __dirname,
      path.resolve(__dirname, 'node_modules/@tetherto/pearpass-lib-ui-kit/node_modules')
    ]
  })
);

export default {
  plugins: [
    rsdPostcssPlugin({
      include: [
        path.resolve(__dirname, 'src/**/*.{js,jsx,mjs,ts,tsx}'),
        path.resolve(__dirname, 'node_modules/@tetherto/pearpass-lib-ui-kit/**/*.{js,jsx,mjs,ts,tsx}')
      ],
      babelConfig: babelLoader,
      useLayers: true,
    }),
    autoprefixer()
  ]
};
