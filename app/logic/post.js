const CommonLogic = require('./common');

const CounterModel = require('../models/mongo/counter');
const BoardModel = require('../models/mongo/board');
const ThreadModel = require('../models/mongo/thread');
const PostModel = require('../models/mongo/post');
const Attachment = require('./attachment');

const config = require('../helpers/config');
const Crypto = require('../helpers/crypto');
const Tools = require('../helpers/tools');

const EventBus = require('../core/event.js');

let PostLogic = module.exports = {};

PostLogic.create = async (fields, token) => {
  let now = new Date;

  let params = {
    board: await BoardModel.readOne(fields.boardName),
    isThread: CommonLogic.isEmpty(fields.threadNumber),
    token,
    lastNumber: await CounterModel.readOne(fields.boardName),
    now
  };
  params.lastNumber++;

  if (!params.isThread) {
    params.thread = await ThreadModel.readOne({
      boardName: fields.boardName,
      threadNumber: fields.threadNumber
    });
  }

  let postValidation = await require('../validators/post')(fields, params);

  if (params.isThread) {
    let threadValidation = await require('../validators/thread')(fields, params);
    let threadInput = CommonLogic.cleanEmpty(threadValidation, params);
    await ThreadModel.create(threadInput); // Thread hook
  }

  let postInput = CommonLogic.cleanEmpty(postValidation);
  postInput = await PostModel.create(postInput); // Post hook

  let { boardName, threadNumber, number, sage, createdAt } = postInput;

  let count = await PostModel.count({
    query: {
      boardName,
      threadNumber
    }
  });

  let { bumpLimit } = params.board;
  if (count <= bumpLimit || config('board.bumpLimit') || !sage) {
    await ThreadModel.update({
      query: {
        boardName,
        number: threadNumber
      },
      fields: {
        updatedAt: now
      }
    })
  }

  let out = [
    boardName,
    threadNumber,
    number
  ];

  EventBus.emit('ws.broadcast', 'RNDR ' + JSON.stringify(out));

  return await PostLogic.readOne({
    boardName,
    postNumber: number
  });
};

/**
 * Reads one post with attachments.
 * @param {String} boardName
 * @param {Number} postNumber
 * @returns {Promise}
 */
PostLogic.readOne = async ({boardName, postNumber} = {}) => {
  postNumber = +postNumber;

  if (!boardName) {
    throw {
      status: 400,
      message: `Board parameter is missed.`
    };
  }
  if (!postNumber || postNumber < 1) {
    throw {
      status: 400,
      message: `Post parameter is missed.`
    };
  }

  let out = await PostModel.readOne({
    boardName,
    postNumber,
    clear: true
  });

  if (!out) {
    let counter = await CounterModel.readOne(boardName);
    let wasPosted = (postNumber <= counter);
    let status = wasPosted ? 410 : 404;
    throw {
      status,
      message:
        wasPosted
          ? `Post was deleted.`
          : `Post doesn't exist yet!`
    };
  }

  if (!out.files || !out.files.length) {
    return out;
  }

  return await _appendAttachments(out);
};

/**
 * @param {String} boardName
 * @param {Number} [limit]
 * @returns {Promise}
 */
PostLogic.countPage = async ({boardName, limit} = {}) => {
  if (!boardName) {
    throw {
      status: 400
    };
  }
  if (!limit) {
    limit = config('board.threadsPerPage');
  }
  return await PostModel.countPage({
    boardName,
    limit
  });
};

/**
 * Reads all posts
 * @param {String} boardName
 * @param {Number} [threadNumber]
 * @param {String} [order]
 * @param {String} [orderBy]
 * @param {Number} [limit]
 * @param {Number} [offset]
 * @return {Promise}
 */
PostLogic.readAll = async args => {
  let posts = await PostModel.readAll(args);
  return Promise.all(posts.map(_appendAttachments));
};

PostLogic.delete = async (fields, checkPassword) => {
  if (!fields.post) {
    throw {
      status: 400,
      message: `No posts to delete!`
    };
  }

  if (checkPassword && !fields.password) {
    throw {
      status: 400,
      message: `No password!`
    };
  }

  return await deletePosts(fields.post, fields.password, checkPassword);
};


async function deletePosts(posts, password, checkPassword) {
  if (!Array.isArray(posts)) {
    posts = [ posts ];
  }

  let promises = posts.reduce((results, post) => {
    results.push(
      new Promise(async resolve => {
        post = post.split(':');

        let postInput = {
          boardName: post[0],
          postNumber: +post[1]
        };

        if (CommonLogic.hasEmpty(postInput)) {
          return resolve(0);
        }

        resolve(await deletePost(postInput, password, checkPassword));
      }).catch(() => 0)
    );
    return results;
  }, []);

  let deletedPosts = await Promise.all(promises).then(results => results.reduce((a, b) => a + b, 0));
  return {deleted: deletedPosts};
}


async function deletePost({boardName, threadNumber, postNumber} = {}, password, checkPassword) {
  let post = await PostModel.readOne({
    boardName,
    threadNumber: +threadNumber || null,
    postNumber: +postNumber || null,
    clear: false
  });
  if (!post) {
    return 0;
  }
  if (checkPassword && !Crypto.verify(password, post.password)) {
    return 0;
  }

  let commonResult = 0;

  // Delete thread
  if (post.number === post.threadNumber && !threadNumber) {
    let deleteAThread = await ThreadModel.deleteOne({boardName, number: +postNumber});
    if (!deleteAThread.result) {
      return 0;
    }
    commonResult += await deletePost(post, password, false);
  }

  let out = [
    post.boardName,
    post.threadNumber,
    post.number
  ];

  EventBus.emit('ws.broadcast', 'REM ' + JSON.stringify(out)); // TODO: WS API subscriptions

  await deleteFiles(post.files, post.boardName, post.number, password, checkPassword);

  let { result } = await PostModel.deleteOne({boardName, number: +postNumber});
  if (result) {
    commonResult += result.n;
  }
  return commonResult;
}


async function deleteFiles(hashes, boardName, postNumber, password, checkPassword) {
  if (!hashes || !hashes.length) {
    return {deleted: 0};
  }

  if (!Array.isArray(hashes)) {
    hashes = [ hashes ];
  }

  let promises = hashes.reduce((results, hash) => {
    results.push(deleteFile(hash, boardName, postNumber, password, checkPassword));
    return results;
  }, []);

  let deletedFiles = Promise.all(promises).then(results => results.reduce((a, b) => a + b, 0)).catch(() => 0);
  return {deleted: deletedFiles};
}


async function deleteFile(hash, boardName, postNumber, password, checkPassword) {
  if (CommonLogic.isEmpty(hash)) {
    return 0;
  }
  if (Tools.isObject(hash)) {
    if (!hash.path) {
      throw {
        status: 500
      };
    }
    hash = hash.path.split('.').shift();
  }

  let post = await PostModel.readOne({
    boardName,
    postNumber,
    clear: false
  });
  if (!post) {
    return 0;
  }
  if (checkPassword && !Crypto.verify(password, post.password)) {
    return 0;
  }
  let attachment = new Attachment.Attachment(null, hash);
  return await attachment.delete(boardName, postNumber) ? 1 : 0;
}

async function _appendAttachments(post) {
  if (!Array.isArray(post.files)) {
    return post;
  }
  for (let i = 0; i < post.files.length; i++) {
    let hash = post.files[i];
    let attachment = new Attachment.Attachment(null, hash);
    if (await attachment.exists()) {
      post.files[i] = attachment.clearEntry();
    }
  }
  return post;
}

PostLogic.processPost = post => {
  if (!post) {
    throw {
      code: 404
    };
  }
  post.text = post.rawText;
  delete post.rawText;
  post.attachments = post.files;
  delete post.files;
  post.modifiers = [];
  ['sage', 'op'].forEach(bool => {
    delete post[bool];
    if (post[bool]) {
      post.modifiers.push(bool);
    }
  });
  return post;
};
