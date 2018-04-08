const router = require('koa-router')({ prefix: '/api/v1/board.' });

const Controller = require('../../index');
const BoardLogic = require('../../../../logic/board');

router.post('create', async (ctx) => {
  let query = ctx.request.body;

  await BoardLogic.create(query, ctx)
    .then(
      out => Controller.success(ctx, out),
      out => Controller.fail(ctx, out)
    )
});

router.post('delete', async (ctx) => {
  let query = ctx.request.body;

  await BoardLogic.delete(query, ctx)
    .then(
      out => Controller.success(ctx, out),
      out => Controller.fail(ctx, out)
    )
});

module.exports = router;
