const router = require('koa-router')();
const Crypto = require('../../../helpers/crypto');
const ThreadLogic = require('../../../logic/thread');
const CounterModel = require('../../../models/mongo/counter');
const Controller = require('../index');

router.get('/lastPostNumbers.json', async ctx => {
  return await CounterModel.read().then(
    out => Controller.success(ctx, out),
    out => Controller.fail(ctx, out)
  );
});

router.get('/api/v1/', async ctx => {
  ctx.body = 'Please, refer to docs to cope with this API.';
});

router.get('/api/v1/sync.data', async ctx => {
  return await ThreadLogic.syncData().then(
    out => Controller.success(ctx, out),
    out => Controller.fail(ctx, out)
  );
});

router.post('/api/v1/file.createHash', async ctx => {
  if (!ctx.request.body
      || !ctx.request.body.file
      || !ctx.request.body.file.path
  ) {
    return Controller.fail(ctx, {
      status: 400,
      message: `No file to make hash from!`
    });
  }
  return await Crypto.crc32(ctx.request.body.file.path, true).then(
    out => Controller.success(ctx, out),
    out => Controller.fail(ctx, out)
  );
});

module.exports = router;
