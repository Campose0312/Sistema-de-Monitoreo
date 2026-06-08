const fs = require('fs');
const postcss = require('postcss');
const tailwind = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');

async function run() {
  try {
    const input = fs.readFileSync('src/index.css', 'utf8');
    const result = await postcss([tailwind, autoprefixer]).process(input, { from: 'src/index.css' });
    fs.writeFileSync('temp-tailwind-debug.css', result.css);
    console.log('Wrote temp-tailwind-debug.css, length:', result.css.length);
    console.log('--- head of generated CSS ---');
    console.log(result.css.slice(0, 1000));
  } catch (err) {
    console.error('ERROR processing CSS:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

run();
