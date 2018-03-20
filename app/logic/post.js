const CommonLogic = require('./common');

const CounterModel = require('../models/mongo/counter');
const BoardModel = require('../models/mongo/board');
const ThreadModel = require('../models/mongo/thread');
const PostModel = require('../models/mongo/post');

const Markup = require('../helpers/markup');
const Crypto = require('../helpers/crypto');

const Websocket = require('../routes/websocket');
let WS = Websocket();

let Post = module.exports = {};

Post.create = async fields => {
  let board = await BoardModel.readOne(fields.boardName);

  if (!board) {
    throw {
      status: 404,
      message: `Board doesn't exist!`
    };
  }
  if (board.closed) {
    throw {
      status: 403,
      message: `Board is closed!`
    };
  }

  let lastNumber = await PostModel.last({
    whereKey: 'boardName',
    whereValue: fields.boardName
  });

  let now = new Date;
  let threadInput = {
    boardName: fields.boardName,
    number: ++lastNumber,
    createdAt: now,
    updatedAt: now
  };

  let isThread = CommonLogic.isEmpty(fields.threadNumber);

  if (!isThread) {
    let thread = await ThreadModel.readOne({
      board: fields.boardName,
      thread: fields.threadNumber
    });
    if (!thread) {
      throw {
        status: 404,
        message: `Thread doesn't exist!`
      };
    }
    if (thread.closed) {
      throw {
        status: 403,
        message: `Thread is closed!`
      };
    }
  }

  let postInput = {
    __proto__: threadInput,
    threadNumber: isThread ? threadInput.number : +fields.threadNumber,
    subject: fields.subject,
    text: await Markup.process(fields.text, threadInput.boardName, threadInput.threadNumber, threadInput.number),
    rawText: fields.text,
    password: CommonLogic.isEmpty(fields.password)
      ? null
      : Crypto.sha256(fields.password),
    sage: !!fields.sageru,
  };

  return new Promise(async resolve => {
    let promise = isThread
      ? ThreadModel.create(threadInput)
      : Promise.resolve();

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

Post.readOne = async fields => {
  let board = fields.board;
  let post = +fields.post;

  if (!board) {
    throw {
      status: 400,
      message: `Board parameter is missed.`
    };
  }
  if (!post) {
    throw {
      status: 400,
      message: `Post parameter is missed.`
    };
  }

  return await PostModel.readOne({
    board: board,
    post: post
  }).then(async out => {
    if (!out) {
      let counter = await CounterModel.readOne(board);
      let wasPosted = (post <= counter);
      let status = wasPosted ? 410 : 404;
      throw {
        status: status
      };
    }
    return out;
  });
};

Post.delete = async fields => {
  if (!fields.post) {
    throw {
      status: 400,
      message: `No posts to delete!`
    };
  }
  /*if (!fields.password) { TODO: Enable after tests
    throw {
      status: 400,
      message: `No password!`
    };
  }*/
  if (!Array.isArray(fields.post)) {
    fields.post = [ fields.post ];
  }

  let promises = fields.post.reduce((previous, current) => {
    previous.push(new Promise(async resolve => {
      let post = current.split(':');

      let postInput = {
        boardName: post[0],
        number: +post[1]
      };

      if (CommonLogic.hasEmpty(postInput)) {
        return resolve(0);
      }

      let check = await PostModel.readOne({
        board: postInput.boardName,
        post: postInput.number,
        clear: false
      });
      if (!check) {
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
      }).catch(() => {
        return 0;
      })
    );
    return previous;
  }, []);
  return Promise.all(promises).then((postInputs) => {
    return {
      deleted: postInputs.reduce((input, current) => current + input, 0)
    };
  });
};
