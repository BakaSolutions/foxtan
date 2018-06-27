const Busboy = require('busboy');
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

    ctx.req.pipe(busboy);
    setTimeout(() => resolve('Body parsing timeout'), 5000);

    busboy.on('file', (fieldname, file, filename, encoding) => {

      if (!filename) { //TODO: Filter mimetype
        return file.resume();
      }

      let extension = path.parse(filename).ext;
      let tmpPath = path.join(config('directories.temporary'), +new Date + extension);

      setTimeout(() => {
        FS.unlinkSync(tmpPath);
      }, 300000);


      let size = 0;

      file.on('data', data => size += data.length);

      file.pipe(FS.createWriteStream(tmpPath)).on('close', async () => {
        correctFieldMatching(fields, fieldname, {
          encoding,
          mime: await FS.getMime(tmpPath),
          extension: await FS.getExtension(tmpPath) || extension,
          name: filename,
          size,
          path: tmpPath
        });
      });
    });

    busboy.on('field', (fieldname, val) => correctFieldMatching(fields, fieldname, val));

    busboy.on('finish', () => {
      busboy = null;
      if (Object.keys(fields).length) {
        ctx.request.body = fields;
      }
      resolve(ctx.request.body);
    });

    busboy.on('error', reject);
  });
};
