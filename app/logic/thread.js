const config = require('../helpers/config');
const Tools = require('../helpers/tools');

const PostModel = require('../models/dao').DAO('post');
const PostLogic = require('./post');
const ThreadModel = require('../models/dao').DAO('thread');

let ThreadLogic = module.exports = {};

ThreadLogic.readAllByBoard = async (boardName, {count, page} = {}) => {
  let out = await ThreadModel.readAllByBoard(boardName, {count, page});
  return Tools.sequence(out, processThread);
};

ThreadLogic.readOneById = async (id, {count, page} = {}) => {
  let out = await ThreadModel.readOneById(id, {count, page});
  return processThread(out);
};

ThreadLogic.readOneByHeadId = async (headId, {count, page} = {}) => {
  let out = await ThreadModel.readOneByHeadId(headId, {count, page});
  return processThread(out);
};

ThreadLogic.readOneByBoardAndPost = async (boardName, postNumber, {count, page} = {}) => {
  let out = await ThreadModel.readOneByBoardAndPost(boardName, postNumber, {count, page});
  return processThread(out);
};

/*
 * @param {String} boardName
 * @param {Number} threadNumber
 * @param {Number} [last]
 * @returns {Promise}
 */
ThreadLogic.readOne = async (boardName, threadNumber, last = config('board.lastPostsNumber')) => {
  if (!Tools.isNumber(threadNumber)) {
    throw {
      code: 400,
      message: "WRONG_PARAM",
      description: 'Wrong `thread` parameter.'
    };
  }
  if (last && last !== config('board.lastPostsNumber') && last < 3) {
    throw {
      code: 400,
      message: "WRONG_PARAM",
      description: 'Wrong `last` parameter.'
    };
  }

  let out = await readOneThread(boardName, +threadNumber);

  let count = await PostModel.count({
    query: {
      boardName,
      threadNumber
    }
  });

  let offset = 1;

  if (last && count > last) {
    offset = count - last;
  }

  let opPost = await PostLogic.readOne({
    boardName,
    postNumber: threadNumber
  });
  out.posts = [ opPost ];

  let posts = await PostLogic.readAll({
    boardName,
    threadNumber,
    order: 'createdAt',
    orderBy: 'ASC',
    limit: last,
    offset
  });

  out.posts.push(...posts);

  if (last) {
    out.omittedPosts = count - out.posts.length;
    out.postCount = count;
  }

  return out;
};

/**
 * @param {String} boardName
 * @param {Number} page
 * @param {Number} [count]
 * @param {Number} [lastReplies]
 * @param {Number} [lastRepliesForFixed]
 * @returns {Promise}
 */
ThreadLogic.readPage = async (boardName, page, {count, lastReplies, lastRepliesForFixed} = {}) => {
  if (!Tools.isNumber(page)) {
    throw {
      code: 400,
      message: "WRONG_PARAM",
      description: `Wrong \`page\` parameter.`
    };
  }
  if (!Tools.isNumber(count)) {
    lastReplies = config('board.threadsPerPage');
  }
  if (!Tools.isNumber(lastReplies)) {
    lastReplies = config('board.lastPostsNumber');
  }
  if (!Tools.isNumber(lastRepliesForFixed)) {
    lastRepliesForFixed = lastReplies;
  }

  let threads = await ThreadModel.readAllByBoard(boardName, {count, page});
  if (!threads || !threads.length) {
    throw {
      code: 404
    };
  }
  for (let i = 0; i < threads.length; i++) {
    let opPost = await PostLogic.readOne({
      boardName,
      postNumber: threads[i].number
    });
    if (!opPost) {
      let message = `There's a thread, but no OP-post: ${boardName}/${threads[i].number}`;
      throw new Error(message);
    }
    threads[i].posts = [ opPost ];

    let lr = (threads[i].pinned)
      ? lastRepliesForFixed
      : lastReplies;

    if (lr) {
      let posts = await PostLogic.readAll({
        boardName,
        threadNumber: threads[i].number,
        order: 'createdAt',
        orderBy: 'DESC',
        limit: lr
      });
      if (!posts || !posts.length) {
        let message = `There's a thread, but no posts: ${boardName}/${threads[i].number}`;
        throw new Error(message);
      }
      if (posts[posts.length - 1].number === posts[posts.length - 1].threadNumber) {
        posts.pop();
      }
      posts.reverse();
      threads[i].posts.push(...posts);
    }

    let count = await PostModel.count({
      query: {
        boardName,
        threadNumber: threads[i].number
      }
    });
    threads[i].omittedPosts = count - threads[i].posts.length;
    threads[i].postCount = count;
  }
  return threads;
};

/**
 * @param {String} boardName
 * @param {Number} page
 * @param {Number} limit
 * @param {String} order
 * @returns {Promise}
 */
ThreadLogic.readFeedPage = async (boardName, page, limit = config('board.threadsPerPage'), order = 'createdAt') => {
  if (!Tools.isNumber(page)) {
    throw {
      code: 400,
      message: "WRONG_PARAM",
      description: `Wrong \`page\` parameter.`
    };
  }

  let feed = await PostLogic.readAll({
    boardName,
    order,
    orderBy: 'DESC',
    limit,
    offset: page * limit
  });
  if (!feed || !feed.length) {
    throw {
      code: 404
    };
  }
  return feed;
};

ThreadLogic.sync = async boardName => {
  let out = {};
  let threads = await ThreadModel.readAllByBoard(boardName);
  for (let i = 0; i < threads.length; i++) {
    let { id } = threads[i];
    out[id] = await PostModel.countByThreadId(id);
  }
  return out;
};

ThreadLogic.pin = async (boardName, threadNumber, pinned) => {
  return await changeThreadBoolean(boardName, threadNumber, { pinned });
};

ThreadLogic.close = async (boardName, threadNumber, closed) => {
  return await changeThreadBoolean(boardName, threadNumber, { closed });
};

ThreadLogic.freeze = async (boardName, threadNumber, frozen) => {
  return await changeThreadBoolean(boardName, threadNumber, { frozen });
};

async function changeThreadBoolean(boardName, threadNumber, param) {
  let thread = await readOneThread(boardName, threadNumber);

  let key = Object.keys(param)[0];
  let value = param[key];
  let isParamSetManually = (typeof value !== 'undefined');
  let realValue = isParamSetManually
    ? value
    : !thread[key]; // reverse exist if not set

  let fields = {};
  if (realValue) {
    fields[key] = true; // else undefined -> delete key from DB
  }
  await ThreadModel.update({
    query: {
      _id: boardName + ':' + threadNumber
    },
    fields
  });
  return {
    [key]: realValue
  };
}

/**
 * @param {String} boardName
 * @param {Number} threadNumber
 * @returns {Promise}
 */
async function readOneThread(boardName, threadNumber) {
  let thread = await ThreadModel.readOne({
    boardName,
    threadNumber
  });
  if (!thread) {
    throw {
      code: 404,
      message: `Thread ${boardName}:${threadNumber} doesn't exist.`
    };
  }
  return thread;
}

async function processThread(thread) {
  if (!thread) {
    throw {
      code: 404
    };
  }
  thread.head = await PostModel.readOneByThreadId(thread.id);
  thread.posts = await PostModel.countByThreadId(thread.id);
  return thread;
}
