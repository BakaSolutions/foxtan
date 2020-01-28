const config = require('../helpers/config');
const Tools = require('../helpers/tools');

const CounterModel = require('../models/mongo/counter');
const PostModel = require('../models/mongo/post');
const PostLogic = require('./post');
const ThreadModel = require('../models/mongo/thread');

let Thread = module.exports = {};

/**
 * @param {String} boardName
 * @param {Number} [limit]
 * @returns {Promise}
 */
Thread.countPage = async ({ boardName, limit}) => {
  if (!boardName) {
    throw {
      status: 400
    };
  }
  if (!limit) {
    limit = config('board.threadsPerPage');
  }
  return await ThreadModel.countPage({
    boardName,
    limit
  });
};

/**
 * @param {String} boardName
 * @param {Number} threadNumber
 * @param {Number} [last]
 * @returns {Promise}
 */
Thread.readOne = async (boardName, threadNumber, last = config('board.lastPostsNumber')) => {
  if (!Tools.isNumber(threadNumber)) {
    throw {
      status: 400,
      message: 'Wrong `thread` parameter.'
    };
  }
  if (last && last !== config('board.lastPostsNumber') && last < 3) {
    throw {
      status: 400,
      message: 'Wrong `last` parameter.'
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
 * @param {Number} [limit]
 * @param {Number} [lastReplies]
 * @param {Number} [lastRepliesForFixed]
 * @returns {Promise}
 */
Thread.readPage = async (boardName, page, limit, lastReplies, lastRepliesForFixed) => {
  if (!Tools.isNumber(page)) {
    throw {
      status: 400,
      message: `Wrong \`page\` parameter.`
    };
  }
  if (!Tools.isNumber(limit)) {
    lastReplies = config('board.threadsPerPage');
  }
  if (!Tools.isNumber(lastReplies)) {
    lastReplies = config('board.lastPostsNumber');
  }
  if (!Tools.isNumber(lastRepliesForFixed)) {
    lastRepliesForFixed = lastReplies;
  }

  let threads = await ThreadModel.readPage({
    boardName,
    page,
    limit
  });
  if (!threads || !threads.length) {
    throw {
      status: 404
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
  return {
    threads,
    lastPostNumber: await CounterModel.readOne(boardName),
    pageCount: await ThreadModel.countPage({
      boardName,
      limit
    })
  };
};

/**
 * @param {String} boardName
 * @param {Number} page
 * @param {Number} limit
 * @param {String} order
 * @returns {Promise}
 */
Thread.readFeedPage = async (boardName, page, limit = config('board.threadsPerPage'), order = 'createdAt') => {
  if (!Tools.isNumber(page)) {
    throw {
      status: 400,
      message: `Wrong \`page\` parameter.`
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
      status: 404
    };
  }
  return {
    feed,
    lastPostNumber: await CounterModel.readOne(boardName),
    pageCount: await PostModel.countPage({
      boardName,
      limit
    })
  };
};

/**
 * @param {String} boardName
 * @param {Number} page
 * @param {Number} limit
 * @param {String} order
 * @returns {Promise}
 */
Thread.readCatPage = async (boardName, page, limit = config('board.threadsPerPage'), order = 'createdAt') => {
  if (!Tools.isNumber(page)) {
    throw {
      status: 400,
      message: `Wrong \`page\` parameter.`
    };
  }

  let feed = await ThreadModel.readAll({
    boardName,
    order,
    orderBy: 'DESC',
    limit,
    offset: page * limit
  });
  if (!feed || !feed.length) {
    throw {
      status: 404
    };
  }
  for (let i = 0; i < feed.length; i++) {
    feed[i].opPost = await PostLogic.readOne({
      boardName,
      postNumber: feed[i].number
    });
  }
  return feed;
};

/**
 * Return some counters to be a client synced
 * @return {Promise}
 */
Thread.syncData = async () => {
  let out = {
    lastPostNumbers: await CounterModel.read(),
    threadCounts: {}
  };
  let threads = await ThreadModel.readAll();
  for (let i = 0; i < threads.length; i++) {
    let { boardName, number } = threads[i];
    if (typeof out.threadCounts[boardName] === 'undefined') {
      out.threadCounts[boardName] = {};
    }
    out.threadCounts[boardName][number] = await PostModel.count({
      query: {
        boardName,
        threadNumber: number
      }
    });
  }
  return out;
};

Thread.pin = async (boardName, threadNumber, pinned) => {
  return await changeThreadBoolean(boardName, threadNumber, { pinned });
};

Thread.close = async (boardName, threadNumber, closed) => {
  return await changeThreadBoolean(boardName, threadNumber, { closed });
};

Thread.bumpLock = async (boardName, threadNumber, unbumpable) => {
  return await changeThreadBoolean(boardName, threadNumber, { unbumpable });
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
      status: 404,
      message: `Thread ${boardName}:${threadNumber} doesn't exist.`
    };
  }
  return thread;
}