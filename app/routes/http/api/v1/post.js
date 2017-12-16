const router = require('koa-router')({ prefix: '/api/v1/post.' });

const BoardModel = require('../../../../models/mongo/board');
const ThreadModel = require('../../../../models/mongo/thread');
const PostModel = require('../../../../models/mongo/post');
const Controllers = require('../../../index');
const Crypto = require('../../../../helpers/crypto');
const Websocket = require('../../../websocket');
let WS = Websocket();

router.post('create', async ctx => {
  await Controllers.parseForm(ctx);
  let query = ctx.request.body;

  let lastNumber = await PostModel.last({
    whereKey: 'boardName',
    whereValue: query.boardName
  });

  let board = await BoardModel.readOne(query.boardName);
  if (!board) {
    return ctx.throw(404, new Error(`Board doesn't exist!`));
  }
  if (board.closed) {
    return ctx.throw(403, new Error(`Board is closed`));
  }

  let now = new Date();
  let threadInput = {
    boardName: query.boardName,
    number: ++lastNumber,
    createdAt: now,
    updatedAt: now
  };

  let postInput = Object.assign({}, threadInput);
  let isThread = (typeof query.threadNumber === 'undefined' || query.threadNumber === '');

  if (!isThread) {
    let thread = await ThreadModel.readOne({
      board: query.boardName,
      thread: query.threadNumber
    });
    if (!thread) {
      return ctx.throw(404, new Error(`Thread doesn't exist!`));
    }
    if (thread.closed) {
      return ctx.throw(403, new Error('Thread is closed.'));
    }
  }

  postInput.threadNumber = isThread
      ? threadInput.number
      : +query.threadNumber;
  postInput.subject = query.subject;
  postInput.text =  // TODO: Разметка
  postInput.rawText = query.text;
  postInput.password = (typeof query.password !== 'undefined' && query.password !== '')
    ? Crypto.sha256(query.password)
    : null;
  postInput.sage = !!query.sageru;

  return new Promise(async resolve => {
    let promise = (isThread)
      ? ThreadModel.create(threadInput)
      : Promise.resolve();
    let post = promise.then(async () => await PostModel.create(postInput));

    let out = [
      postInput.boardName,
      postInput.threadNumber,
      postInput.number
    ];
    WS.broadcast('RNDR ' + JSON.stringify(out));
    if (typeof query.redirect !== 'undefined' && query.redirect !== '') {
      let map = {
        ':board': postInput.boardName,
        ':thread': postInput.threadNumber,
        ':post': postInput.number
      };
      query.redirect = query.redirect.replace(/:(?:board|thread|post)/g, m => map[m]);
      let pathBack = (ctx.req.headers['origin'] === 'null')
        ? query.redirect
        : ctx.req.headers['origin'] + '/' + query.redirect;
      return setTimeout(() => {
        ctx.redirect(pathBack);
        return resolve();
      }, 500);
    }
    ctx.status = 201;
    ctx.body = post;

    return resolve();
  }).catch(e => {
    return ctx.throw(500, e);
  });
});

['get', 'post'].forEach(function (method) {
  router[method]('read', async (ctx) => {
    if (method === 'post') {
      await Controllers.parseForm(ctx);
      ctx.request.query = ctx.request.body;
    }

    let board = ctx.request.query.board;
    if (typeof board === 'undefined') {
      ctx.throw(400, 'Board parameter is missed.');
    }
    let post = ctx.request.query.post;
    if (typeof post === 'undefined') {
      ctx.throw(400, 'Post parameter is missed.');
    }
    await PostModel.readOne({
      board: board,
      post: post
    }).then(out => {
      if (out === null) {
        return ctx.throw(404);
      }
      ctx.body = out;
    }).catch(e => {
      return ctx.throw(400, e);
    });
  });
});

module.exports = router;
