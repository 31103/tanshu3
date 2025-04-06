import * as esbuild from 'esbuild';
import { fromFileUrl } from 'https://deno.land/std@0.224.0/path/from_file_url.ts'; // Import path module if needed

// 絶対パスを取得 (Deno スクリプトの場所基準)
const scriptDir = fromFileUrl(new URL('.', import.meta.url));
const projectRoot = fromFileUrl(new URL('..', import.meta.url)); // Project root is one level up

console.log('Starting esbuild...');

try {
  const result = await esbuild.build({
    entryPoints: [`${projectRoot}/src/browser/main.ts`], // Use absolute path for entry point
    outfile: `${projectRoot}/public/js/main.js`, // Use absolute path for output
    bundle: true, // Bundle all dependencies
    format: 'esm', // Output format: ECMAScript Module
    minify: true, // Minify the output code
    sourcemap: true, // Generate sourcemap
    logLevel: 'info', // Show build logs
    absWorkingDir: projectRoot, // Set working directory for relative paths inside esbuild
  });
  console.log('esbuild finished successfully:', result);
} catch (error) {
  console.error('esbuild failed:', error);
  Deno.exit(1); // Exit with error code
} finally {
  // Ensure esbuild process is stopped, allowing Deno to exit cleanly
  esbuild.stop();
}

console.log('Build script finished.');
