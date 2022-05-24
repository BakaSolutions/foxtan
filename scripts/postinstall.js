const fs = require('fs').promises;

const src = 'app/Infrastructure/Config.js';
const dst = 'config.js';

(async () => {
  try {
    let file = await fs.readFile(dst, 'utf8');
    // Check if config already exists
    if (file) {
      console.debug('Config file already exists. No action needed.');
      process.exit(0);
    }
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.error(e);
    }
  }
  // Read template
  let configTemplate = await fs.readFile(src, 'utf8');
  // Fix template
  let config = configTemplate
      .replace(/\.\.\/\.\./gm, '.')
      .split('\n')
      .filter(line => !line.includes('Figurecon'))
      .join('\n')
    + 'module.exports = config;\n';
  // Write default config
  await fs.writeFile(dst, config);
  console.debug('Created a new config from template.')
})();
