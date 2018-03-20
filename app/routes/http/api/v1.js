const router = require('koa-router')();
const ThreadLogic = require('../../../logic/thread');
const CounterModel = require('../../../models/mongo/counter');
const Controllers = require('../../index');

router.get('/lastPostNumbers.json', async ctx => {
  return await CounterModel.read().then(
    out => Controllers.success(ctx, out),
    out => Controllers.fail(ctx, out)
  );
});

router.get('/api/v1/', async ctx => {
  ctx.body = 'Please, refer to docs to cope with this API.';
});

router.get('/api/v1/sync.data', async ctx => {
  return await ThreadLogic.syncData().then(
    out => Controllers.success(ctx, out),
    out => Controllers.fail(ctx, out)
  );
});

module.exports = router;
