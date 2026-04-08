import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://github.io',
  base: '/asseteye-site/',
  output: 'static',
  build: {
    assets: 'assets'
  }
});
