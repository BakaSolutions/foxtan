const CommonLogic = require('./common');

const ThreadModel = require('../models/dao').DAO('thread');
const PostModel = require('../models/dao').DAO('post');

const BoardLogic = require('./board.js');
const FileLogic = require('./file.js');

const Thread = require('../object/Thread.js');
const Post = require('../object/Post.js');

const Crypto = require('../helpers/crypto.js');
const Tools = require('../helpers/tools.js');
const FS = require('../helpers/fs.js');

const EventBus = require('../core/event.js');

let PostLogic = module.exports = {};

PostLogic.create = async (fields, token) => {
  let {boardName, threadNumber, threadId, sage, subject, text, file, fileMark} = fields;
  let thread;

  try {
    await ThreadModel.transactionBegin();

    let now = new Date;
    let isThread = false;

    if (threadId) {
      // Type 1.1: `threadId` only
      // It's a post of the thread.
      thread = await ThreadModel.readOneById(threadId);
    } else if (boardName && threadNumber) {
      // Type 1.2: `boardName` and `threadNumber`
      // It's a post of the thread.
      threadNumber = +threadNumber; // "1" => 1
      thread = await ThreadModel.readOneByBoardAndPost(boardName, threadNumber);
    } else if (boardName) {
      // Type 2: `boardName` only
      // It's a new thread!!1
      isThread = true;
    } else {
      // Type 3: Incorrect request
      throw {
        status: 400,
        message: 'boardName/threadNumber or threadId are missed'
      }
    }

    if (!isThread && !thread) {
      throw {
        status: 404,
        message: 'There is no such a thread'
      }
    }
    thread = new Thread({creative: isThread}).bulk(thread); // TODO: Create Thread in ThreadModel

    // `boardName`, `threadNumber` or `threadId` may be not set!
    // Use only `board`, `thread` and `post` from this place.

    let board = await BoardLogic.readOne(thread.boardName || boardName);
    if (!board) {
      throw {
        status: 404,
        message: 'There is no such a board'
      }
    }
    if (board.modifiers && board.modifiers.closed) {
      throw {
        status: 403,
        message: 'This board is closed'
      };
    }

    if (isThread) {
      thread.boardName = boardName;
      thread.created = now;

      thread = await ThreadModel.create(thread); // Thread hook
      thread = new Thread().bulk(thread); // TODO: Create Thread in ThreadModel
    }

    let post = new Post({creative: true});
    let lastNumber = await PostModel.readLastNumberByBoardName(thread.boardName);

    post.threadId = thread.id;
    post.number = ++lastNumber;
    if (subject.length) {
      post.subject = subject;
    }
    post.text = text;
    post.sessionKey = token.tid;

    if (sage) {
      post.modifiers.push('sage');
    }

    post.created = now;

    post = await PostModel.create(post); // Post hook
    post = new Post().bulk(post); // TODO: Create Post in PostModel

    let files = [];
    for (let [key, value] of Object.entries(file || {})) {
      value.modifiers = [];
      if (fileMark && fileMark[key] && fileMark[key]['NSFW']) {
        value.modifiers.push('NSFW');
      }
      files.push(value);
    }
    for (let fileInfo of files) {
      await FileLogic.create(fileInfo, post);
    }
    // TODO: Use batch

    await ThreadModel.transactionEnd();

    let out = [
      thread.boardName,
      post.threadId,
      post.number
    ];

    //EventBus.emit('ws.broadcast', 'RNDR ' + JSON.stringify(out)); // TODO: create event subscriptions
    return out;
  } catch (e) {
    await ThreadModel.transactionRollback();
    if (file) {
      let paths = Object.values(file).map(f => f.path);
      await Tools.parallel(FS.unlink, paths);
    }
    throw e;
  }
};

/**
 * Reads one post with attachments.
 * @param {String} boardName
 * @param {Number} number
 * @returns {Promise}
 */
PostLogic.readOneByBoardAndPost = async (boardName, number) => {
  number = +number;

  if (!boardName) {
    throw {
      status: 400,
      message: `Board parameter is missed.`
    };
  }
  if (!number || number < 1) {
    throw {
      status: 400,
      message: `Post parameter is missed.`
    };
  }

  let post = await PostModel.readOneByBoardAndPost(boardName, number);

  if (!post) {
    let counter = await PostModel.readLastNumberByBoardName(boardName);
    let wasPosted = (number <= counter);
    let status = wasPosted ? 410 : 404;
    throw {
      status,
      message:
        wasPosted
          ? `Post was deleted.`
          : `Post doesn't exist yet!`
    };
  }

  return FileLogic.appendAttachments(post);
};

PostLogic.readOneById = async postId => {
  let post = await PostModel.readOneById(postId);
  return FileLogic.appendAttachments(post);
};

PostLogic.readOneByThreadId = async threadId => {
  let post = await PostModel.readOneByThreadId(threadId);
  return FileLogic.appendAttachments(post);
};

PostLogic.readAllByBoardName = async (boardName, { count, page, order } = {}) => {
  let posts = await PostModel.readAllByBoardName(boardName, { count, page, order });
  return Tools.parallel(FileLogic.appendAttachments, posts);
};

PostLogic.readAllByThreadId = async (threadId, { count, page, order } = {}) => {
  let posts = await PostModel.readAllByThreadId(threadId, { count, page, order });
  return Tools.parallel(FileLogic.appendAttachments, posts);
};

PostLogic.delete = () => {
  throw {
    status: 501
  }
};
