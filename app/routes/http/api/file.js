const config = require('../../../helpers/config.js');
const Tools = require('../../../helpers/tools.js');

const router = require('koa-router')({
  prefix: config('server.pathPrefix')
});

const HTTP = require('../index.js');
const FileLogic = require('../../../logic/file.js');

router.post('api/deleteFile', async ctx => {
  try {
    let { body: query, token } = ctx.request;

    if (!query || !query.selectedFile) {
      throw {
        status: 400,
        message: "Select a file to delete"
      }
    }

    let values = Object.entries(query.selectedFile).reduce((fileHashes, [postId, hashObject]) => {
      fileHashes.push({
        postId,
        fileHash: Object.keys(hashObject)[0]
      });
      return fileHashes;
    }, []);

    let results = await Tools.parallel(FileLogic.deleteByPostIdAndFileHash, values, token);
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
