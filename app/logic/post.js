const CommonLogic = require('./common');

const BoardModel = require('../models/dao').DAO('board');
const ThreadModel = require('../models/dao').DAO('thread');
const PostModel = require('../models/dao').DAO('post');

const File = require('./file.js');

const Thread = require('../object/Thread.js');
const Post = require('../object/Post.js');

const Crypto = require('../helpers/crypto.js');
const Tools = require('../helpers/tools.js');
const FS = require('../helpers/fs.js');

const EventBus = require('../core/event.js');

let PostLogic = module.exports = {};

PostLogic.create = async (fields, token) => {
  let {boardName, threadNumber, sage, subject, text, file, fileMark} = fields;
  let files = Object.values(file || {});

  try {
    await ThreadModel.transactionBegin();

    let now = new Date;

    let board = await BoardModel.readByName(boardName);
    if (board.modifiers && board.modifiers.closed) {
      throw {
        status: 403,
        message: 'This board is closed'
      };
    }

    let isThread = CommonLogic.isEmpty(threadNumber);
    let thread;
    if (isThread) {
      thread = new Thread({creative: true})
    } else {
      threadNumber = +threadNumber; // "1" => 1
      let threadFromDB = await ThreadModel.readOneByBoardAndPost(boardName, threadNumber);
      if (!threadFromDB) {
        throw {
          status: 404,
          message: 'There is no such a thread'
        };
      }
      thread = new Thread().bulk(threadFromDB); // TODO: Create Thread in ThreadModel
    }

    try {
      for (let { mime, name, size, path } of files) {
        let mimeType = mime.split('/')[0];
        let F = new File[mimeType]({
          mime,
          name,
          size,
          path
        });
        await F.createHash();
        await F.check();
        path = await F.store();
        await F.createThumb();
      }
    } catch (e) {
      //await Tools.parallel(files, FS.unlink); TODO: unlink files by their real path, not temp!
      throw e;
    }

    if (isThread) {
      thread.boardName = boardName;
      thread.created = now;

      thread = await ThreadModel.create(thread); // Thread hook
      thread = new Thread().bulk(thread); // TODO: Create Thread in ThreadModel
    }

    let post = new Post({creative: true});
    let lastNumber = await PostModel.readLastNumberByBoardName(boardName);
    // "threadId", "userId", "number", "subject", "text",
    // "sessionKey", "modifiers", "ipAddress", "created", "deleled"
    post.threadId = thread.id;
    post.number = ++lastNumber;
    if (subject.length) {
      post.subject = subject;
    }
    post.text = text;
    post.sessionKey = token.tid;

    if (sage) {
      post.modifiers = [];
      post.modifiers.push('sage');
    }

    post.created = now;

    post = await PostModel.create(post); // Post hook
    post = new Post().bulk(post); // TODO: Create Post in PostModel

    await ThreadModel.transactionEnd();

    let out = [
      boardName,
      post.threadId,
      post.number
    ];

    EventBus.emit('ws.broadcast', 'RNDR ' + JSON.stringify(out));
    return out;
  } catch (e) {
    await ThreadModel.transactionRollback();
    await Tools.parallel(files, FS.unlink);
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

  let out = await PostModel.readOneByBoardAndPost(boardName, number);

  if (!out) {
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

  if (!out.files || !out.files.length) {
    return out;
  }

  return out; // _appendAttachments(out);
};

PostLogic.readOneById = async postId => {
  let post = await PostModel.readOneById(postId);
  return post; // _appendAttachments(post);
};

PostLogic.readAllByBoardName = async (boardName, { count, page, order }) => {
  let posts = await PostModel.readAllByBoardName(boardName, { count, page, order });
  return posts;//Promise.all(posts.map(_appendAttachments));
};


PostLogic.readAllByThreadId = async (threadId, { count, page, order }) => {
  let posts = await PostModel.readAllByThreadId(threadId, { count, page, order });
  return posts;//Promise.all(posts.map(_appendAttachments));
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
