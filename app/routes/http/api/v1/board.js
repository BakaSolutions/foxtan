const router = require('koa-router')({ prefix: '/api/v1/board.' });

const BoardModel = require('../../../../models/mongo/board');
const Controllers = require('../../../index');

router.post('create', async (ctx) => {
  await Controllers.parseForm(ctx);
  let query = ctx.request.body;

  let boardInput = {
    board: query.board,
    title: query.title,
    subtitle: query.subtitle || null,
    hidden: !!query.hidden || false,
    closed: !!query.closed || false,
    bumpLimit: query.bumpLimit || 500,
    maxBoardSize: query.maxBoardSize || -1,
    createdAt: new Date()
  };

  for (let key in boardInput) {
    if (typeof boardInput[key] === 'undefined' || boardInput[key] === '') {
      ctx.throw(400, `Wrong \`${key}\` parameter.`);
    }
  }

  let check = await BoardModel.readOne(query.board);
  if (check !== null) {
    ctx.throw(409, 'Board already exists.');
  }

  return new Promise(async resolve => {
    await BoardModel.create(boardInput);
    ctx.body = await BoardModel.readOne(boardInput.board);
    return resolve();
  }).catch(e => {
    return ctx.throw(500, e);
  });
});

module.exports = router;