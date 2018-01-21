const CounterModel = require('../models/mongo/counter');
const BoardModel = require('../models/mongo/board');
const ThreadModel = require('../models/mongo/thread');
const PostModel = require('../models/mongo/post');

const Markup = require('../helpers/markup');
const Crypto = require('../helpers/crypto');

const Websocket = require('../routes/websocket');
let WS = Websocket();

let Post = module.exports = {};

Post.create = async (fields, ctx) => {
  let board = await BoardModel.readOne(fields.boardName);

  if (!board) {
    return ctx.throw(404, new Error(`Board doesn't exist!`));
  }
  if (board.closed) {
    return ctx.throw(403, new Error(`Board is closed`));
  }

  let lastNumber = await PostModel.last({
    whereKey: 'boardName',
    whereValue: fields.boardName
  });

  let now = new Date();
  let threadInput = {
    boardName: fields.boardName,
    number: ++lastNumber,
    createdAt: now,
    updatedAt: now
  };

  let isThread =
    (typeof fields.threadNumber === 'undefined'
         || fields.threadNumber === '');

  if (!isThread) {
    let thread = await ThreadModel.readOne({
      board: fields.boardName,
      thread: fields.threadNumber
    });
    if (!thread) {
      return ctx.throw(404, new Error(`Thread doesn't exist!`));
    }
    if (thread.closed) {
      return ctx.throw(403, new Error('Thread is closed.'));
    }
  }

  let postInput = {
    __proto__: threadInput,
    threadNumber: isThread ? threadInput.number : +fields.threadNumber,
    subject: fields.subject,
    text: await Markup.process(fields.text, threadInput.boardName, threadInput.threadNumber, threadInput.number),
    rawText: fields.text,
    password: (typeof fields.password !== 'undefined' && fields.password !== '')
      ? Crypto.sha256(fields.password)
      : null,
    sage: !!fields.sageru,
  };

  return new Promise(async resolve => {
    let promise = (isThread) ? ThreadModel.create(threadInput) : Promise.resolve();

    let post = promise.then(async () => await PostModel.create(postInput));

    let out = [
      postInput.boardName,
      postInput.threadNumber,
      postInput.number
    ];

    WS.broadcast('RNDR ' + JSON.stringify(out));
    return resolve(post);
  });
};

Post.readOne = async (fields, ctx) => {
  let board = fields.board;
  let post = fields.post;

  if (typeof board === 'undefined') {
    ctx.throw(400, 'Board parameter is missed.');
  }
  if (typeof post === 'undefined') {
    ctx.throw(400, 'Post parameter is missed.');
  }

  return await PostModel.readOne({
    board: board,
    post: post
  }).then(async out => {
    if (out === null) {
      let counter = await CounterModel.readOne(board);
      let wasPosted = (post <= counter);
      return ctx.throw(wasPosted ? 410 : 404);
    }
    return out;
  });
};

Post.delete = async (fields, ctx) => {
  if (typeof fields.post === 'undefined') {
    return ctx.throw(400, 'No posts to delete!');
  }
  /*if (typeof fields.password === 'undefined') { TODO: Enable after tests
    return ctx.throw(400, 'No password');
  }*/
  if (!Array.isArray(fields.post)) {
    fields.post = [ fields.post ];
  }

  let promises = fields.post.reduce((previous, current, i) => {
    return previous.push(new Promise(async resolve => {
      let post = fields.post[i].split(':');

      let postInput = {
        boardName: post[0],
        number: +post[1]
      };

      for (let key in postInput) {
        if (typeof postInput[key] === 'undefined' || postInput[key] === '') {
          return resolve(0);
        }
      }

      let check = await PostModel.readOne({
        board: postInput.boardName,
        post: postInput.number,
        clear: false
      });
      if (check === null) {
        return resolve(0);
      }
      /*if (!Crypto.verify(fields.password || '', check.password)) {
        return resolve(0);
      }*/

      let commonResult = 0;

      if (check.number === check.threadNumber) {  // Delete thread
        let { result } = await ThreadModel.deleteOne(postInput);
        if (result) {
          commonResult += result.n;
        }

        postInput = {
          boardName: check.boardName,
          threadNumber: check.number
        };
      }

      let out = [
        check.boardName,
        check.threadNumber,
        check.number
      ];
      WS.broadcast('REM ' + JSON.stringify(out));

      let { result } = await PostModel.deleteMany(postInput);
      if (result) {
        commonResult += result.n;
      }
      resolve(commonResult);
    }));
  }, []);

  return Promise.all(promises).then((postInputs) => {
    return {
      deleted: postInputs.reduce((input, current) => {
        return current + input;
      }, 0)
    };
  });
};
