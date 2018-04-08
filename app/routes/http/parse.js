const Busboy = require('busboy');
const path = require('path');
const config = require('../../helpers/config');
const FS = require('../../helpers/fs');


module.exports = ctx => {
  ctx.request.body = {};
  if (ctx.request.method !== "POST" || !ctx.request.is('urlencoded', 'multipart')) {
    return;
  }
  return new Promise((resolve, reject) => {
    let busboy = new Busboy({ headers: ctx.req.headers });
    let fields = {};

    ctx.req.pipe(busboy);
    setTimeout(() => reject('Body parsing timeout'), 5000);

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      let extension = path.parse(filename).ext;
      let tmpPath = path.join(config('tmpdir'), +new Date + extension);

      console.log('File [' + fieldname + '] ' + tmpPath);

      setTimeout(() => {
        FS.unlinkSync(tmpPath);
      }, 300000);

      file.pipe(FS.createWriteStream(tmpPath));

      let size = 0;

      file.on('data', data => {
        size += data.length;
      });
      file.on('end', () => {
        fields[fieldname] = {
          encoding: encoding,
          mime: mimetype,
          name: filename,
          size: size,
          path: tmpPath
        };
        console.log('File [' + fieldname + '] Finished.');
        console.log(fields[fieldname]);
      });
    });

    busboy.on('field', (fieldname, val) => {
      let matches = fieldname.match(/(.+)\[(.*)]$/);
      if (!matches) {
        return fields[fieldname] = val;
      }
      if (!fields[matches[1]]) {
        fields[matches[1]] = [];
      }
      if (!matches[2]) {
        return fields[matches[1]].push(val);
      }
      if (!fields[matches[1]][matches[2]]) {
        fields[matches[1]][matches[2]] = [];
      }
      fields[matches[1]][matches[2]].push(val);
    });

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
