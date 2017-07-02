let common = module.exports = {};

const http = require('http'),
    Busboy = require('busboy'),
    Tools = require('../helpers/tools');

common.throw = function(res, status, msg) {
  let out = {};
  /*if (status !== 200) */out.status = status || 500;
  out.error = ((typeof msg !== 'undefined' && msg.code)? msg.code: msg) || http.STATUS_CODES[out.status];
  res.status(out.status).json(out);
};

common.removeInfo = function(post) {
  delete post['posts_sticked'];
  delete post['posts_locked'];
  delete post['posts_cycled'];
  return post;
};

common.parseForm = function(req) {
  return new Promise(function (resolve, reject) {
    let busboy = new Busboy({ headers: req.headers }),
        fields = {};
    /*busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
      file.on('data', function(data) {
        console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
      });
      file.on('end', function() {
        console.log('File [' + fieldname + '] Finished');
      });
    });*/ // TODO: Parse files
    busboy.on('field', function(fieldname, val) {
      fields[fieldname] = val;
    });
    busboy.on('finish', function() {
      req.body = Tools.merge(req.body, fields);
      resolve();
    });
    req.pipe(busboy);
  });
};