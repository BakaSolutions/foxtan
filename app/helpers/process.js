const { spawn } = require( 'child_process' );

module.exports = { create, listen };

function create(command, args) {
  if (!Array.isArray(args)) {
    args = args.split(' ');
  }
  return spawn( command, args );
}

async function listen(process) {
  return new Promise((resolve, reject) => {
    let out = '';
    process.stdout.on('data', data => out += data);
    process.stderr.on('data', data => out += data);
    process.on('close', code => {
      if (code) {
        return reject(new Error(out));
      }
      resolve(out);
    });
    process.on('error', reject);
  })
}
