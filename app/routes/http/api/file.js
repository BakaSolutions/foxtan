const config = require('../../../helpers/config.js');
const Tools = require('../../../helpers/tools.js');

const router = require('koa-router')({
  prefix: config('server.pathPrefix')
});

const HTTP = require('../index.js');
const AttachmentLogic = require('../../../logic/attachment.js');

router.post('api/deleteFile', async ctx => {
  try {
    let { body: query, originalBody, token } = ctx.request;

    if (!query || !query.selectedFile) {
      throw {
        status: 400,
        message: "Select a file to delete"
      }
    }

    let values = Object.keys(originalBody).reduce((fileHashes, key) => {
      let boardName, postId, postNumber, fileHash;
      let [_0, _1, _2, _3] = key.split(':');
      if (_3) { // boardName, postNumber, fileHash
        boardName = _1;
        postNumber = +_2;
        fileHash = _3;
      } else if (_2) { // postId, fileHash
        postId = +_1;
        fileHash = _2;
      } else { // fileHash
        fileHash = _1;
      }

      fileHashes.push({
        boardName,
        postNumber,
        postId,
        fileHash
      });
      return fileHashes;
    }, []);

    let results = await Tools.parallel(AttachmentLogic.delete, values, token);
    let deleted = results.reduce((a, b) => a + b, 0);

    if (HTTP.isAJAXRequested(ctx)) {
      const out = {
        deleted
      };
      return HTTP.success(ctx, out);
    }
    return HTTP.success(ctx, 'OK');
  } catch (e) {
    return HTTP.fail(ctx, e);
  }
});

module.exports = router;
