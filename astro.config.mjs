// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://gesagtundgetan.de',
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory' },
  // Keine Telemetrie, keine externen Schriften, keine Skripte von Dritten.
  devToolbar: { enabled: false },
});
