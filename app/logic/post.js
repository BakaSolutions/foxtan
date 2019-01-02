const CommonLogic = require('./common');

const CounterModel = require('../models/mongo/counter');
const BoardModel = require('../models/mongo/board');
const ThreadModel = require('../models/mongo/thread');
const PostModel = require('../models/mongo/post');
const Attachment = require('./attachment');

const Crypto = require('../helpers/crypto');
const Tools = require('../helpers/tools');
const Validator = require('../helpers/validator');

const Websocket = require('../routes/websocket');
let WS = Websocket();

let Post = module.exports = {};

Post.create = async (fields, token) => {
  let now = new Date;
  let lastNumber = await CounterModel.readOne(fields.boardName);

  let board;
  let thread;

  let threadInput = {
    _id: {
      value: `${fields.boardName}:${lastNumber}`
    },
    boardName: {
      value: fields.boardName,
      required: true,
      func: async (v, done) => {
        board = await BoardModel.readOne(v);

        if (!board) {
          return done(`Board doesn't exist!`);
        }
        if (board.closed) {
          return done(`Board is closed!`);
        }
      }
    },
    threadNumber: {
      value: fields.threadNumber,
      type: 'number',
      func: async (v, done, input) => {
        let isThread = CommonLogic.isEmpty(v);
        if (!isThread) {
          thread = await ThreadModel.readOne({
            board: input.boardName,
            thread: v
          });
          if (!thread) {
            return done(`Thread doesn't exist!`);
          }
          if (thread.closed) {
            return done(`Thread is closed!`);
          }
        }
      }
    },
    number: {
      value: ++lastNumber,
    },
    createdAt: {
      value: now
    },
    updatedAt: {
      value: now
    }
  };

  let validation = Validator(threadInput);
  if (!validation.passed) {
    throw {
      status: 400,
      message: validation.errors.toString()
    };
  }
  threadInput = validation.fields;

  let postInput = {
    threadNumber: {
      value: thread
        ? threadInput.number
        : threadInput.threadNumber,
      required: true
    },
    subject: {
      value: fields.subject
    },
    rawText: {
      value: fields.text
    },
    password: {
      value: CommonLogic.isEmpty(fields.password)
        ? null
        : Crypto.sha256(fields.password)
    },
    id: {
      value: token._id || token.tid,
      required: true
    },
    files: {
      value: fields.file || [],
      func: async (files, done, input) => {
        let out = [];
        let fileAmount = Math.min(files.length, board.fileLimit); // TODO: Process only unique files

        if (!files.length && !input.rawText) {
          return done('Nor post nor file is present');
        }

        for (let i = 0; i < fileAmount; i++) {
          let file = files[i];
          if (CommonLogic.isEmpty(file)) {
            continue;
          }
          if (!file.mime) {
            return done(`This file has no MIME-type: ${file.name}`);
          }
          file.boardName = threadInput.boardName;
          file.postNumber = threadInput.number;
          file.nsfw = fields.nsfwFile
            ? fields.nsfwFile[i]
              ? true
              : null
            : null;

          let type = Tools.capitalize(file.mime.split('/')[0]);
          let attachment = (!Attachment[type])
            ? new Attachment(file)
            : new Attachment[type](file);

          if (!await attachment.checkFile()) {
            return done(`This type of file is not allowed: ${file.mime}`);
          }
          await attachment.store();

          let hash = attachment.file._id;
          if (!postInput.files.includes(hash)) {
            out.push(hash);
          }
        }
        done(null, out)
      }
    },
    sage: {
      value: fields.sage,
      type: 'boolean'
    },
    op: {
      value: fields.op,
      func: async (v, done) => {
        if (!thread) { // OP-post check
          let opPost = await PostModel.readOne({
            board: threadInput.boardName,
            post: threadInput.threadNumber,
            clear: false
          });
          if (v && (opPost.id === postInput.id)) {
            return done(null, true);
          }
        } else if (v) {
          done(null, true);
        }
        return done();
      }
    },
    createdAt: {
      value: now
    },
    updatedAt: {
      value: null
    }
  };

  validation = Validator(postInput);
  if (!validation.passed) {
    throw {
      status: 400,
      message: validation.errors.toString()
    };
  }
  postInput = Object.assign(validation.fields, threadInput);
  postInput = CommonLogic.cleanEmpty(postInput);
  delete threadInput.threadNumber;

  if (thread) {
    await ThreadModel.create(threadInput) // Thread hook
  }

  await PostModel.create(postInput); // Post hook

  let out = [
    postInput.boardName,
    postInput.threadNumber,
    postInput.number
  ];

  WS.broadcast('RNDR ' + JSON.stringify(out)); // post-hook

  return await Post.readOne({
    board: out[0],
    post: out[2]
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
  if (!post || post < 1) {
    throw {
      status: 400,
      message: `Post parameter is missed.`
    };
  }

  let out = await PostModel.readOne({
    board,
    post,
    clear: true
  });

  if (!out) {
    let counter = await CounterModel.readOne(board);
    let wasPosted = (post <= counter);
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

Post.countPage = async ({board, limit} = {}) => {
  if (!board) {
    throw {
      status: 400
    }
  }
  if (!limit) {
    limit = config('board.threadsPerPage');
  }
  return await PostModel.countPage({
    board,
    limit
  });
};

Post.readAll = async args => {
  let posts = await PostModel.readAll(args);
  return Promise.all(posts.map(_appendAttachments));
};

Post.delete = async (fields, checkPassword) => {
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


async function deletePost({boardName, postNumber, threadNumber} = {}, password, checkPassword) {
  let post = await PostModel.readOne({
    board: boardName,
    post: +postNumber || null,
    threadNumber: +threadNumber || null,
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
  WS.broadcast('REM ' + JSON.stringify(out)); // TODO: Create WS events

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
      }
    }
    hash = hash.path.split('.').shift();
  }

  let post = await PostModel.readOne({
    board: boardName,
    post: postNumber,
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
