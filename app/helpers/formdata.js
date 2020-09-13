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

function fileName() {
  let date = +new Date();
  tempFileName = (date === tempFileName)
    ? ++date
    : date;
  return tempFileName;
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
      if (!(fieldname.startsWith('file'))) {
        return reject('Files must be in appropriate form fields');
      }

      let size = 0;
      file.on('data', data => size += data.length);

      let stream = await FileType.stream(file);
      if (!size) {
        return file.resume(); // empty field
      }

      let {ext, mime} = stream.fileType || {};
      if (!mime) {
        return reject('Unsupported file type: ' + filename);
      }

      let tmpPath = path.join(config('directories.temporary'), fileName() + '.' + ext);
      uploadedFiles.push(tmpPath);

      let writable = FS.createWriteStream(tmpPath);
      stream.pipe(writable);

      file.on('end', () => {
        correctFieldMatching(fields, fieldname, {
          mime,
          name: filename,
          size,
          path: tmpPath
        });
      });
    });

    busboy.on('field', (fieldname, val) => correctFieldMatching(fields, fieldname, val));

    busboy.on('finish', () => {
      process.nextTick(() => {
        if (Object.keys(fields).length) {
          ctx.request.body = fields;
        }
        resolve(ctx.request.body);
      });
    });

    busboy.on('error', err => {
      ctx.req.unpipe(busboy);
      busboy = null;
      reject(err);
    });
  }).catch(async e => {
    await Tools.parallel(uploadedFiles, FS.unlink);
    throw {
      status: 400,
      message: e
    }
  });
};
