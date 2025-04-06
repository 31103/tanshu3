import { ensureDir } from 'jsr:@std/fs@^0.229.1/ensure-dir';
import { join } from 'jsr:@std/path@^0.225.2/join';

const CWD = Deno.cwd();
const PUBLIC_DIR = join(CWD, 'public');
const DIST_DIR = join(CWD, 'dist');
const OUTPUT_HTML_PATH = join(DIST_DIR, 'tanshu3.html');

async function runBuild(): Promise<void> {
  console.log('Running build process (deno task bundle)...');
  const command = new Deno.Command(Deno.execPath(), {
    args: ['task', 'bundle'],
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const status = await command.output();
  if (!status.success) {
    throw new Error(`Build failed with code: ${status.code}`);
  }
  console.log('Build completed successfully.');
}

async function createSingleHtml(): Promise<void> {
  console.log('Reading source files...');
  const [htmlContent, cssContent, jsContent] = await Promise.all([
    Deno.readTextFile(join(PUBLIC_DIR, 'index.html')),
    Deno.readTextFile(join(PUBLIC_DIR, 'css', 'styles.css')),
    Deno.readTextFile(join(PUBLIC_DIR, 'js', 'main.js')),
  ]);
  console.log('Source files read.');

  console.log('Injecting CSS and JavaScript into HTML...');
  let processedHtml = htmlContent.replace(
    /<link rel="stylesheet" href="css\/styles\.css">/,
    `<style>\n${cssContent}\n</style>`,
  );
  processedHtml = processedHtml.replace(
    /<script src="js\/main\.js"><\/script>/,
    `<script>\n${jsContent}\n</script>`,
  );
  console.log('CSS and JavaScript injected.');

  console.log(`Ensuring output directory exists: ${DIST_DIR}`);
  await ensureDir(DIST_DIR);
  console.log('Output directory ensured.');

  console.log(`Writing processed HTML to: ${OUTPUT_HTML_PATH}`);
  await Deno.writeTextFile(OUTPUT_HTML_PATH, processedHtml);
  console.log('Processed HTML written successfully.');
}

async function main() {
  try {
    console.log('Starting single HTML generation process...');
    await runBuild();
    await createSingleHtml();
    console.log('Single HTML generation process completed successfully!');
    console.log(`Output file: ${OUTPUT_HTML_PATH}`);
  } catch (error) {
    console.error('Error during single HTML generation:', error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
