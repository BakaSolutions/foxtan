const Busboy = require('busboy');
const FileType = require('file-type');

const path = require('path');

const config = require('./config.js');
const FS = require('./fs.js');
const Tools = require('./tools.js');

function correctFieldMatching(fields, field, value) {
  let a = field.split(':');
  let o = fields;
  for (let i = 0; i < a.length - 1; i++) {
    let n = a[i];
    if (!(n in o)) {
      o[n] = {};
    }
    o = o[n];
  }
  o[a[a.length - 1]] = value;
}

let tempFileName;

function timestamp() {
  let date = +new Date();
  tempFileName = (date === tempFileName)
    ? ++date
    : date;
  return tempFileName;
}

async function readChunk(file, filename) {
  let chunk = file.read(4100);
  if (!chunk) {
    return new Promise(resolve => {
      file.once('readable', () => resolve(readChunk(...arguments)));
    });
  }
  let { ext, mime } = await FileType.fromBuffer(chunk) || {};
  if (!mime) {
    throw new Error('Unsupported file type: ' + filename);
  }
  file.unshift(chunk);
  return { ext, mime };
}

module.exports = ctx => {
  ctx.request.body = {};
  if (ctx.request.method !== "POST" || !ctx.request.is('urlencoded', 'multipart')) {
    return;
  }
  let uploadedFiles = [];
  return new Promise((resolve, reject) => {
    let busboy = new Busboy({ headers: ctx.req.headers });
    let fields = {};

    ctx.req.pipe(busboy);
    setTimeout(() => reject('Body parsing timeout'), 30000);

    busboy.on('file', async (fieldname, file, filename) => {
      try {
        if (!(fieldname.startsWith('file'))) {
          throw new Error('Files must be in appropriate form fields');
        }
        if (!filename) {
          return file.resume();
        }
        let {ext, mime} = await readChunk(file, filename);

        let size = 0;
        let tmpPath = path.join(config('directories.temporary'), timestamp() + '.' + ext);
        uploadedFiles.push(tmpPath);

        file.on('data', data => size += data.length);
        file.on('end', () => {
          correctFieldMatching(fields, fieldname, {
            mime,
            name: filename,
            size,
            path: tmpPath
          });
          setTimeout(() => FS.unlink(tmpPath), 10000); // TODO: remove temp file only on errors!
        });
        let writable = FS.createWriteStream(tmpPath);
        file.pipe(writable);
      } catch (e) {
        file.resume();
        busboy.emit('error', e);
      }
    });

    busboy.on('field', (fieldname, val) => correctFieldMatching(fields, fieldname, val));

    busboy.on('finish', () => {
      if (Object.keys(fields).length) {
        ctx.request.body = fields;
      }
      resolve(ctx.request.body);
    });

    busboy.on('error', err => {
      ctx.req.unpipe(busboy);
      busboy = null;
      reject(err);
    });
  }).catch(e => {
    Tools.parallel(uploadedFiles, FS.unlink);
    throw {
      status: 400,
      message: e.message
    }
  });
};
