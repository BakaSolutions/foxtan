const router = require('koa-router')();
const ThreadLogic = require('../../../logic/thread');
const CounterModel = require('../../../models/mongo/counter');
const Controller = require('../index');

router.get('/lastPostNumbers.json', async ctx => {
  try {
    let out = await CounterModel.read();
    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

router.get('/api/v1/', async ctx => {
  ctx.body = 'Please, refer to docs to cope with this API.';
});

router.get('/api/v1/sync.data', async ctx => {
  try {
    let out = await ThreadLogic.syncData();
    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

module.exports = router;
