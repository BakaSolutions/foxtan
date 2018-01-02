const router = require('koa-router')({ prefix: '/api/v1/post.' });

const BoardModel = require('../../../../models/mongo/board');
const ThreadModel = require('../../../../models/mongo/thread');
const PostModel = require('../../../../models/mongo/post');
const Crypto = require('../../../../helpers/crypto');
const Markup = require('../../../../helpers/markup');
const Websocket = require('../../../websocket');
let WS = Websocket();

router.post('create', async ctx => {
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
  postInput.text = await Markup.process(query.text, postInput.boardName, postInput.threadNumber, postInput.number);
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

    let map = {
      ':board': postInput.boardName,
      ':thread': postInput.threadNumber,
      ':post': postInput.number
    };
    if (isRedirect(query)) {
      return await redirect(ctx, query, /:(?:board|thread|post)/g, map);
    }

    ctx.status = 201;
    ctx.body = post;
    return resolve();
  }).catch(e => {
    return ctx.throw(500, e);
  });
});

['get', 'post'].forEach((method) => {
  router[method]('read', async (ctx) => {
    if (method === 'post') {
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


router.post('delete', async (ctx) => {
  let query = ctx.request.body;
  let promises = [];

  if (typeof query.post === 'undefined') {
    return ctx.throw(400, 'No posts to delete!');
  }
  if (typeof query.password === 'undefined') {
    return ctx.throw(400, 'No password');
  }

  if (!Array.isArray(query.post)) {
    query.post = [ query.post ];
  }
  for (let i = 0; i < query.post.length; i++) {
    promises[i] = new Promise(async resolve => {
      let post = query.post[i].split(':');

      let postInput = {
        boardName: post[0],
        number: +post[1]
      };

      for (let key in postInput) {
        if (typeof postInput[key] === 'undefined' || postInput[key] === '') {
          return resolve(/*`Wrong \`${key}\` parameter.`*/);
        }
      }

      let check = await PostModel.readOne({
        board: postInput.boardName,
        post: postInput.number
      });
      if (check === null) {
        return resolve(/*'Post doesn\'t exist.'*/);
      }
      let out = [
        check.boardName,
        check.threadNumber,
        check.number
      ];
      WS.broadcast('RNDR ' + JSON.stringify(out));

      return resolve(postInput);
    });
  }

  return Promise.all(promises).then((postInput) => {
    if (!postInput || !Array.isArray(postInput)) {
      return;
    }
    let commonResult = {ok: 0, n: 0};
    let promises = [];
    for (let i = 0; i < postInput.length; i++) {
      promises[i] = new Promise(async (resolve, reject) => {
        let post = await PostModel.readOne({
          board: postInput[i].boardName,
          post: postInput[i].number,
          clear: false
        });
        if (!Crypto.verify(query.password, post.password)) {
          return resolve();
        }
        let { result } = await PostModel.delete(postInput[i]);
        if (!result) {
          return resolve();
        }
        if (result.ok) {
          commonResult.ok = 1;
        }
        commonResult.n += result.n;
        resolve();
      })
    }
    return Promise.all(promises).then(() => {
      return commonResult;
    });
  }).then(async (result) => {
    if (isRedirect(query)) {
      return await redirect(ctx, ctx.request.body);
    }
    ctx.status = result.ok && result.n
        ? 200
        : 401;
    ctx.body = result;
  }).catch(e => {
    return ctx.throw(500, e);
  });
});

function isRedirect(query) {
  console.log(
    !(typeof query.redirect === 'undefined' || query.redirect === ''),
    (typeof query.redirect !== 'undefined' && query.redirect !== '')
  );
  return !(typeof query.redirect === 'undefined' || query.redirect === '');
}

function redirect(ctx, query, regexp, map) {
  return new Promise(resolve => {
    if (typeof query.redirect !== 'undefined' && query.redirect !== '') {
      if (typeof map !== 'undefined') {
        query.redirect = query.redirect.replace(regexp, m => map[m]);
      }
      return setTimeout(() => {
        ctx.redirect(query.redirect);
        return resolve();
      }, 1000);
    }
  })
}


module.exports = router;
