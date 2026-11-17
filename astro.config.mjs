// @ts-check
import { defineConfig } from 'astro/config';

// Static output: works unchanged on Vercel and Netlify.
export default defineConfig({
  output: 'static',
  compressHTML: true,
  build: {
    inlineStylesheets: 'always'
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 900
    }
  }
});
