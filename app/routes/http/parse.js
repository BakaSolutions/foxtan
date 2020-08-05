const Busboy = require('busboy');
const FileType = require('file-type');

const path = require('path');
const config = require('../../helpers/config');
const FS = require('../../helpers/fs');

function correctFieldMatching(fields, field, value) {
  let matches = field.match(/(.+)\[(.*)]$/);

  // `something`
  if (!matches) {
    if (typeof fields[field] === 'undefined') {
      return fields[field] = value;
    }

    // lots of `something`
    if (!Array.isArray(fields[field])) {
      fields[field] = [ fields[field] ];
    }
    fields[field].push(value);
    return [ ...new Set(fields[field]) ];
  }

  // `something[]`
  if (!fields[matches[1]]) {
    fields[matches[1]] = [];
  }
  if (!matches[2]) {
    return fields[matches[1]].push(value);
  }

  // `something[smth]`
  if (!fields[matches[1]][matches[2]]) {
    return fields[matches[1]][matches[2]] = value;
  }
  fields[matches[1]][matches[2]] = [...fields[matches[1]][matches[2]], value];
}

module.exports = ctx => {
  ctx.request.body = {};
  if (ctx.request.method !== "POST" || !ctx.request.is('urlencoded', 'multipart')) {
    return;
  }
  return new Promise((resolve, reject) => {
    let busboy = new Busboy({ headers: ctx.req.headers });
    let fields = {};
    let uploadedFiles = [];

    ctx.req.pipe(busboy);
    setTimeout(() => reject('Body parsing timeout'), 5000);

    busboy.on('file', async (fieldname, file, filename) => {
      let size = 0;
      let {ext, mime} = await FileType.fromStream(file);

      if (!(fieldname.startsWith('file'))) {
        throw new Error('Files must be in appropriate form fields');
      }
      if (!mime) {
        throw new Error('Unsupported file type: ' + filename);
      }

      let tmpPath = path.join(config('directories.temporary'), +new Date + '.' + ext);

      uploadedFiles.push(tmpPath);

      file.on('data', data => size += data.length);

      file.on('end', async () => {
        correctFieldMatching(fields, fieldname, {
          mime,
          extension: ext,
          name: filename,
          size,
          path: tmpPath
        });
      });

      file.pipe(FS.createWriteStream(tmpPath));
    });

    busboy.on('field', (fieldname, val) => correctFieldMatching(fields, fieldname, val));

    busboy.on('finish', () => {
      busboy = null;
      if (Object.keys(fields).length) {
        ctx.request.body = fields;
      }
      resolve(ctx.request.body);
      uploadedFiles.forEach(file => FS.unlink(file)); // TODO: Remove this and call after move/copy
    });

    busboy.on('error', err => {
      reject(err);
      uploadedFiles.forEach(file => FS.unlink(file));
    });
  });
};
