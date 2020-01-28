const router = require('koa-router')();

const BoardLogic = require('../../../logic/board');
const ThreadLogic = require('../../../logic/thread');
const IndexLogic = require('../../../logic');
const Controller = require('../index');

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
  Controller.success(ctx, IndexLogic.index());
});

router.get('/boards.json', async ctx => {
  try {
    let out = await BoardLogic.readAll();
    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

router.get('/:board/board.json', async ctx => {
  try {
    let { board } = ctx.params;
    let out = await BoardLogic.readOne(board);
    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

/*
 * Why do we use ThreadLogic instead of BoardLogic in the routers below?
 * Coz we grab threads, not boards!
 * Is it correct? ( о.о)?
 */
router.get('/:board/pageCount.json', async ctx => {
  try {
    let { board } = ctx.params;

    let out = await ThreadLogic.countPage({
      board,
      limit: ctx.request.query.limit
    });
    return Controller.success(ctx, {pageCount: out});
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

router.get('/:board/:page.json', async ctx => {
  try {
    let { board, page } = ctx.params;
    let out = await ThreadLogic.readPage(board, +page, ctx.request.query.limit);
    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

router.get('/:board/feed/:page.json', async ctx => {
  try {
    let { board, page } = ctx.params;
    let out = await ThreadLogic.readFeedPage(board, +page);
    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

router.get('/:board/cat/:type/:page.json', async ctx => {
  try {
    let { board, page, type } = ctx.params;

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

    let out = await ThreadLogic.readCatPage(board, page, order);
    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

router.get('/:board/res/:thread/:last.json', async ctx => {
  try {
    let { board, thread, last } = ctx.params;
    let out = await ThreadLogic.readOne(board, +thread, +last);
    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

router.get('/:board/res/:thread.json', async ctx => {
  try {
    let { board, thread } = ctx.params;
    let out = await ThreadLogic.readOne(board, +thread);
    return Controller.success(ctx, out);
  } catch (e) {
    return Controller.fail(ctx, e);
  }
});

module.exports = router;
