const fs = require('fs').promises;

const src = 'app/Infrastructure/Config.js'
const dst = 'config.js'

fs.readFile(dst, 'utf8')
  // Check if config already exists
  .then(() => {
    console.debug('Config file already exists. No action needed.')
    process.exit(0);
  })
  .catch(() => null)
  // Read template
  .then(() => (
    fs.readFile(src, 'utf8')
  ))
  // Fix template
  .then((configTemplate) => (
    configTemplate
      .replace(/\.\.\/\.\./gm, '.')
      .split('\n')
      .filter(line => !line.includes('Figurecon'))
      .join('\n')
      + 'module.exports = config;\n'
  ))
  // Write default config
  .then((config) => (
    fs.writeFile(dst, config)
  ))
  .then(() => (
    console.debug('Created a new config from template.')
  ))
