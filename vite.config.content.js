import path from 'path'

import { defineConfig } from 'vite'
import viteBabel from 'vite-plugin-babel'

const webOnlyExtensions = [".web.js", ".web.jsx", ".web.ts", ".web.tsx"];

export default defineConfig({
  plugins: [
    viteBabel({
      filter: /\.[jt]sx?$/,
    }),
  ],
  resolve: {
    preserveSymlinks: false,
    dedupe: ['react', 'react-dom'],
    extensions: [
      ...webOnlyExtensions,
      ".mjs",
      ".js",
      ".mts",
      ".ts",
      ".jsx",
      ".tsx",
      ".json",
    ]
  },
  optimizeDeps: {
    exclude: ['@tetherto/pearpass-lib-ui-kit', 'react-strict-dom'],
  },
  ssr: {
    noExternal: ['react-strict-dom']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        content: path.resolve(__dirname, 'src/content/index.js'),
        'inject-shim': path.resolve(__dirname, 'src/content/inject-shim.js')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})
