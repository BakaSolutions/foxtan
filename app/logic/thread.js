const config = require('../helpers/config');
const Tools = require('../helpers/tools');

const CounterModel = require('../models/mongo/counter');
const PostModel = require('../models/mongo/post');
const ThreadModel = require('../models/mongo/thread');

let Thread = module.exports = {};

Thread.countPage = async ({board, limit} = {}) => {
  if (!board) {
    throw {
      status: 400
    }
  }
  return await ThreadModel.countPage({
    board: board,
    limit: limit || config('board.threadsPerPage')
  });
};

Thread.readOne = async (board, thread, last = null) => {
  if (!Tools.isNumber(thread)) {
    throw {
      status: 400,
      message: 'Wrong `thread` parameter.'
    };
  }
  if (last !== null && last < 3) {
    throw {
      status: 400,
      message: 'Wrong `last` parameter.'
    };
  }
  let out = await ThreadModel.readOne({
    board: board,
    thread: thread
  });
  if (!out) {
    throw {
      status: 404
    };
  }

  let opPost = await PostModel.readOne({
    board: board,
    post: thread
  });
  out.posts = [ opPost ];

  let posts = await PostModel.readAll({
    board: board,
    thread: thread,
    order: 'createdAt',
    orderBy: 'DESC',
    limit: last !== null
      ? last || config('board.lastPostsNumber')
      : null,
    offset: 0
  });
  if (posts[posts.length - 1].number === posts[posts.length - 1].threadNumber) {
    posts.pop();
  }
  posts.reverse();
  out.posts.push(...posts);

  let count = await PostModel.count({
    whereKey: ['boardName', 'threadNumber'],
    whereValue: [board, thread]
  });
  out.omittedPosts = count - out.posts.length;

  return out;
};

Thread.readPage = async (board, page, limit = config('board.threadsPerPage')) => {
  if (!Tools.isNumber(page)) {
    throw {
      status: 400,
      message: `Wrong \`page\` parameter.`
    };
  }
  let threads = await ThreadModel.readPage({
    board: board,
    page: page
  });
  if (!threads || !threads.length) {
    throw {
      status: 404
    };
  }
  for (let i = 0; i < threads.length; i++) {
    let opPost = await PostModel.readOne({
      board: board,
      post: threads[i].number
    });
    if (!opPost) {
      let message = `There's a thread, but no OP-post: ${board}/${threads[i].number}`;
      console.log(message);
      throw new Error(message);
    }
    threads[i].posts = [ opPost ];

    let posts = await PostModel.readAll({
      board: board,
      thread: threads[i].number,
      order: 'createdAt',
      orderBy: 'DESC',
      limit: config('board.lastPostsNumber')
    });
    if (!posts || !posts.length) {
      let message = `There's a thread, but no posts: ${board}/${threads[i].number}`;
      console.log(message);
      throw new Error(message);
    }
    if (posts[posts.length - 1].number === posts[posts.length - 1].threadNumber) {
      posts.pop();
    }
    posts.reverse();
    threads[i].posts.push(...posts);

    let count = await PostModel.count({
      whereKey: ['boardName', 'threadNumber'],
      whereValue: [board, threads[i].number]
    });
    threads[i].omittedPosts = count - threads[i].posts.length;
  }
  return {
    threads: threads,
    lastPostNumber: await CounterModel.readOne(board),
    pageCount: await ThreadModel.countPage({
      board: board,
      limit: limit
    })
  }
};

Thread.readFeedPage = async (board, page) => {
  if (!Tools.isNumber(page)) {
    throw {
      status: 400,
      message: `Wrong \`page\` parameter.`
    };
  }

  let feed = await ThreadModel.readAll({
    board: board,
    order: 'createdAt',
    orderBy: 'DESC',
    limit: config('board.threadsPerPage'),
    offset: page * config('board.threadsPerPage')
  });
  if (!feed || !feed.length) {
    throw {
      status: 404
    };
  }
  return feed;
};

Thread.readCatPage = async (board, page, order = 'createdAt') => {
  if (!Tools.isNumber(page)) {
    throw {
      status: 400,
      message: `Wrong \`page\` parameter.`
    };
  }

  let feed = await ThreadModel.readAll({
    board: board,
    order: order,
    orderBy: 'DESC',
    limit: config('board.threadsPerPage'),
    offset: page * config('board.threadsPerPage')
  });
  if (!feed || !feed.length) {
    throw {
      status: 404
    };
  }
  for (let i = 0; i < feed.length; i++) {
    feed[i].opPost = await PostModel.readOne({
      board: board,
      post: feed[i].number
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
  await ThreadModel.readAll().then(async threads => {
    for (let i = 0; i < threads.length; i++) {
      if (typeof out.threadCounts[threads[i].boardName] === 'undefined') {
        out.threadCounts[threads[i].boardName] = {};
      }
      out.threadCounts[threads[i].boardName][+threads[i].number] = await PostModel.count({
        whereKey: ['boardName', 'threadNumber'],
        whereValue: [threads[i].boardName, +threads[i].number]
      });
    }
  });
  return out;
};
