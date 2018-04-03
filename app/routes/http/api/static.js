const router = require('koa-router')();

const config = require('../../../helpers/config');
const BoardLogic = require('../../../logic/board');
const ThreadLogic = require('../../../logic/thread');
const Controllers = require('../../index');

/**
 * These routers [should] write files after requests.
 *
 * Info:
 * - get counters (/lastPostNumbers.json)
 *
 * Boards:
 * - get all boards (/boards.json)
 * - get specific board info (/:board/board.json)
 * - get count of an board page (/:board/pageCount.json)
 * - get specific board page (/:board/:page.json)
 * - get catalog (/:board/cat/:type/:page.json) (type: [recent, bumped])
 *
 * Threads:
 * - get specific thread (/:board/res/:thread.json)
 * - get last posts of a thread (/:board/res/:thread/:last.json)
 *
 * Posts:
 * - get last posts on a board (/:board/feed/:page.json)
 */

router.all('/', async ctx => {
  Controllers.success(ctx, {
    engine: 'Foxtan/' + config('server.version')
  });
});

router.get('/boards.json', async ctx => {
  await BoardLogic.readAll().then(
    out => Controllers.success(ctx, out),
    out => Controllers.fail(ctx, out)
  )
});

router.get('/:board/board.json', async ctx => {
  let board = ctx.params.board;

  await BoardLogic.readOne(board).then(
    out => Controllers.success(ctx, out),
    out => Controllers.fail(ctx, out)
  )
});

/**
 * Why do we use ThreadLogic instead of BoardLogic in the routers below?
 * Coz we grab threads, not boards!
 */
router.get('/:board/pageCount.json', async ctx => {
  let board = ctx.params.board;

  await ThreadLogic.countPage({
    board: board,
    limit: ctx.request.query.limit
  }).then(
    out => Controllers.success(ctx, {pageCount: out}),
    out => Controllers.fail(ctx, out)
  )
});

router.get('/:board/:page.json', async ctx => {
  let board = ctx.params.board;
  let page = +ctx.params.page;

  await ThreadLogic.readPage(board, page, ctx.request.query.limit).then(
    out => Controllers.success(ctx, out),
    out => Controllers.fail(ctx, out)
  );
});

router.get('/:board/feed/:page.json', async ctx => {
  let board = ctx.params.board;
  let page = +ctx.params.page;

  await ThreadLogic.readPage(board, page).then(
    out => Controllers.success(ctx, out),
    out => Controllers.fail(ctx, out)
  );
});

router.get('/:board/cat/:type/:page.json', async ctx => {
  let {board, page, type} = ctx.params;

  let order;
  switch (type) {
    case 'recent':
      order = 'createdAt';
      break;
    case 'bumped':
      order = 'updatedAt';
      break;
    default:
      return ctx.throw(400, 'Wrong `type` parameter.');
  }

  await ThreadLogic.readCatPage(board, page, order).then(
    out => Controllers.success(ctx, out),
    out => Controllers.fail(ctx, out)
  );
});

router.get('/:board/res/:thread/:last.json', async ctx => {
  let board = ctx.params.board;
  let thread = +ctx.params.thread;
  let last = +ctx.params.last;
  await ThreadLogic.readOne(board, thread, last).then(
    out => Controllers.success(ctx, out),
    out => Controllers.fail(ctx, out)
  );
});

router.get('/:board/res/:thread.json', async ctx => {
  let board = ctx.params.board;
  let thread = +ctx.params.thread;
  await ThreadLogic.readOne(board, thread).then(
      out => Controllers.success(ctx, out),
      out => Controllers.fail(ctx, out)
  );
});

module.exports = router;
