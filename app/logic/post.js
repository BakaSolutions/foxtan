const CommonLogic = require('./common');

const CounterModel = require('../models/mongo/counter');
const BoardModel = require('../models/mongo/board');
const ThreadModel = require('../models/mongo/thread');
const PostModel = require('../models/mongo/post');
const Attachment = require('./attachment');

const Crypto = require('../helpers/crypto');
const Markup = require('../helpers/markup');
const Tools = require('../helpers/tools');

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

  let lastNumber = await CounterModel.readOne(fields.boardName);

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
      thread: +fields.threadNumber
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
    threadNumber:
      isThread
        ? threadInput.number
        : +fields.threadNumber,
    subject: fields.subject,
    text: await Markup.process(
      fields.text,
      threadInput.boardName,
      threadInput.threadNumber,
      threadInput.number
    ),
    rawText: fields.text,
    password:
      CommonLogic.isEmpty(fields.password)
        ? null
        : Crypto.sha256(fields.password),
    sage: !!fields.sage,
    files: []
  };

  let files = fields.file || [];
  let fileAmount = Math.min(files.length, board.fileLimit);
  for (let i = 0; i < fileAmount; i++) {
    let file = files[i];
    file.boardName = postInput.boardName;
    file.postNumber = postInput.number;
    if (!file.mime) {
      continue;
    }
    let type = Tools.capitalize(file.mime.split('/')[0]);
    let attachment = (!Attachment[type])
      ? new Attachment(file)
      : new Attachment[type](file);
    await attachment.checkFile();
    await attachment.store();
    let hash = attachment.hash;
    if (!postInput.files.includes(hash)) {
      postInput.files.push(hash);
    }
  }

  return new Promise(async resolve => {
    let promise =
      isThread
        ? ThreadModel.create(threadInput)
        : Promise.resolve();

    promise.then(async () => await PostModel.create(postInput))
      .then(async () => {
        let out = [
          postInput.boardName,
          postInput.threadNumber,
          postInput.number
        ];

        WS.broadcast('RNDR ' + JSON.stringify(out));

        let post = await Post.readOne({
          board: out[0],
          post: out[2]
        });

        resolve(post);
      });
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

  return await PostModel.readOne({
    board: board,
    post: post
  }).then(async out => {
    if (!out) {
      let counter = await CounterModel.readOne(board);
      let wasPosted = (post <= counter);
      let status = wasPosted ? 410 : 404;
      throw {
        status: status,
        message: wasPosted ? `Post was deleted.` : `Post doesn't exist yet!`
      };
    }
    return out;
  });
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
          number: +post[1]
        };

        if (CommonLogic.hasEmpty(postInput)) {
          return resolve(0);
        }
        await deleteFile(post.files, password, checkPassword);

        resolve(await deletePost(postInput, password, checkPassword));
      }).catch(() => 0)
    );
    return results;
  }, []);

  let deletedPosts = Promise.all(promises).then(results => results.reduce((a, b) => a + b, 0));
  return {deleted: deletedPosts};
}


async function deletePost({boardName, postNumber, threadNumber} = {}, password, checkPassword) {
  let post = await PostModel.readOne({
    board: boardName,
    post: postNumber,
    clear: false
  });
  if (!post) {
    return 0;
  }
  if (checkPassword && !Crypto.verify(password || '', post.password)) {
    return 0;
  }

  let commonResult = 0;

  // Delete thread
  if (post.number === post.threadNumber) {
    let deleteAThread = await ThreadModel.deleteOne({boardName, postNumber});
    if (!deleteAThread.result) {
      return 0;
    }
    let deletePostsInAThread = await deletePosts(post, password, checkPassword);
    commonResult += deletePostsInAThread.deleted;
  }

  let out = [
    post.boardName,
    post.threadNumber,
    post.number
  ];
  WS.broadcast('REM ' + JSON.stringify(out)); // TODO: Create WS events

  let { result } = await PostModel.deleteOne({boardName, postNumber});
  if (result) {
    commonResult += result.n;
  }
  return commonResult;
}


/*async function deleteFiles(hashes, password, checkPassword) {
  if (!Array.isArray(hashes)) {
    hashes = [ hashes ];
  }

  let promises = hashes.reduce((results, hash) => {
    results.push(
      new Promise(async resolve => {
        if (CommonLogic.isEmpty(hash)) {
          return resolve(0);
        }

        resolve(await deleteFile(hash, password, checkPassword));
      }).catch(() => 0)
    );
    return results;
  }, []);

  let deletedFiles = Promise.all(promises).then(results => results.reduce((a, b) => a + b, 0));
  return {deleted: deletedFiles};
}*/


async function deleteFile(hash, boardName, postNumber, password, checkPassword) {
  let post = await PostModel.readOne({
    board: boardName,
    post: postNumber,
    clear: false
  });
  if (!post) {
    return 0;
  }
  if (checkPassword && !Crypto.verify(password || '', post.password)) {
    return 0;
  }
  let attachment = new Attachment(null, hash);
  return await attachment.delete(boardName, postNumber);
}