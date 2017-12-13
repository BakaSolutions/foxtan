const router = require('koa-router')();

const config = require('../../../helpers/config');
const Tools = require('../../../helpers/tools');
const BoardModel = require('../../../models/mongo/board');
const PostModel = require('../../../models/mongo/post');
const ThreadModel = require('../../../models/mongo/thread');
const CounterModel = require('../../../models/mongo/counter');
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
  ctx.body = {
    engine: 'Foxtan/' + config('server.version')
  }
});

router.get('/boards.json', async ctx => {
  return await BoardModel.readAll().then(boards => {
    let out = {};
    for (let i = 0; i < boards.length; i++) {
      let board = boards[i].board;
      delete boards[i].board;
      out[board] = boards[i];
    }
    return out;
  }).then(
    out => Controllers.success(ctx, out),
    out => Controllers.fail(ctx, out)
  )
});

router.get('/:board/board.json', async ctx => {
  let board = ctx.params.board;
  return await BoardModel.readOne(board).then(
    out => Controllers.success(ctx, out),
    out => Controllers.fail(ctx, out)
  )
});

router.get('/:board/pageCount.json', async ctx => {
  let board = ctx.params.board;
  return await ThreadModel.countPage({
    board: board,
    limit: ctx.request.query.limit || config('board.threadsPerPage')
  }).then(
    out => Controllers.success(ctx, {pageCount: out}),
    out => Controllers.fail(ctx, out)
  )
});

router.get('/:board/:page.json', async ctx => {
  let board = ctx.params.board;
  let page = +ctx.params.page;
  if (!Tools.isNumber(page)) {
    return ctx.throw(400, 'Wrong `page` parameter.');
  }
  return await ThreadModel.readPage({
    board: board,
    page: page
  }).then(async page => {
    if (!page.length) {
      return ctx.throw(404);
    }
    for (let i = 0; i < page.length; i++) {
      let opPost = await PostModel.readOne({
        board: board,
        post: +page[i].number
      });
      page[i].posts = [ opPost ];

      let posts = await PostModel.readAll({
        board: board,
        thread: +page[i].number,
        order: 'createdAt',
        orderBy: 'DESC',
        limit: config('board.lastPostsNumber')
      });

      if (posts[posts.length - 1].number === posts[posts.length - 1].threadNumber) {
        posts.pop();
      }
      posts.reverse();
      page[i].posts.push(...posts);

      let count = await PostModel.count({
        whereKey: ['boardName', 'threadNumber'],
        whereValue: [board, +page[i].number]
      });
      page[i].omittedPosts = count - page[i].posts.length;
    }
    return page;
  }).then(async threads => {
    return {
      threads: threads,
      lastPostNumber: await CounterModel.readOne(board),
      pageCount: await ThreadModel.countPage({
        board: board,
        limit: ctx.request.query.limit || config('board.threadsPerPage')
      })
    }
  }).then(
    out => Controllers.success(ctx, out),
    out => Controllers.fail(ctx, out)
  );
});

router.get('/:board/feed/:page.json', async ctx => {
  let board = ctx.params.board;
  let page = ctx.params.page;
  if (!Tools.isNumber(+page)) {
    ctx.throw(400, 'Wrong `page` parameter.');
  }
  return await ThreadModel.readAll({
    board: board,
    order: 'createdAt',
    orderBy: 'DESC',
    limit: config('board.threadsPerPage'),
    offset: page * config('board.threadsPerPage')
  }).then(
    out => Controllers.success(ctx, out),
    out => Controllers.fail(ctx, out)
  );
});

router.get('/:board/cat/:type/:page.json', async ctx => {
  let board = ctx.params.board;
  let page = ctx.params.page;
  if (!Tools.isNumber(+page)) {
    ctx.throw(400, 'Wrong `page` parameter.');
  }
  let options = {
    board: board,
    orderBy: 'DESC',
    limit: config('board.threadsPerPage'),
    offset: page * config('board.threadsPerPage')
  };
  let type = ctx.params.type;
  switch (type) {
    case 'recent':
      options['order'] = 'createdAt';
      break;
    case 'bumped':
      options['order'] = 'updatedAt';
      break;
    default:
      return ctx.throw(400, 'Wrong `type` parameter.');
  }
  return await ThreadModel.readAll(options).then(async page => {
    if (!page.length) {
      return ctx.throw(404);
    }
    for (let i = 0; i < page.length; i++) {
      page[i].opPost = await PostModel.readOne({
        board: board,
        post: +page[i].number
      });
    }
    return page;
  }).then(
    out => Controllers.success(ctx, out),
    out => Controllers.fail(ctx, out)
  );
});

router.get('/:board/res/:thread/:last.json', async ctx => {
  let board = ctx.params.board;
  let thread = ctx.params.thread;
  if (!Tools.isNumber(+thread)) {
    ctx.throw(400, 'Wrong `thread` parameter.');
  }
  let last = ctx.params.last;
  if (!Tools.isNumber(+last) || last < 3) {
    ctx.throw(400, 'Wrong `last` parameter.');
  }
  return await ThreadModel.readOne({
    board: board,
    thread: thread
  }).then(async out => {
    if (out === null) {
      return ctx.throw(404);
    }
    let opPost = await PostModel.readOne({
      board: board,
      post: thread
    });
    out.posts = [ opPost ];

    let posts = await PostModel.readAll({
      board: board,
      thread: +thread,
      order: 'createdAt',
      orderBy: 'DESC',
      limit: +last || config('board.lastPostsNumber'),
      offset: 0
    });

    if (posts[posts.length - 1].number === posts[posts.length - 1].threadNumber) {
      posts.pop();
    }
    posts.reverse();
    out.posts.push(...posts);

    let count = await PostModel.count({
      whereKey: ['boardName', 'threadNumber'],
      whereValue: [board, +thread]
    });
    out.omittedPosts = count - out.posts.length;
    return out;
  }).then(
    out => Controllers.success(ctx, out),
    out => Controllers.fail(ctx, out)
  );
});

router.get('/:board/res/:thread.json', async ctx => {
  let board = ctx.params.board;
  let thread = ctx.params.thread;
  if (!Tools.isNumber(+thread)) {
    ctx.throw(400, 'Wrong `thread` parameter.');
  }
  return await ThreadModel.readOne({
    board: board,
    thread: thread
  }).then(async out => {
    if (out === null) {
      return ctx.throw(404);
    }
    out.posts = await PostModel.readAll({
      board: board,
      thread: +thread
    });
    out.lastPostNumber = await ThreadModel.getCounters({
      boards: board,
      threads: +thread
    });
    return out;
  }).then(
    out => Controllers.success(ctx, out),
    out => Controllers.fail(ctx, out)
  );
});

module.exports = router;
