import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

// GitHub Pages phục vụ site tại /<tên-repo>/. Đặt BASE_PATH khi build trên CI.
export default defineConfig({
  site: process.env.SITE_URL || 'https://hoang200175.github.io',
  base: process.env.BASE_PATH || '/',
  integrations: [mdx(), react()],
  markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } } },
});
