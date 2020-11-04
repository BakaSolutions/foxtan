//const config = require('../helpers/config');
const Tools = require('../helpers/tools');

const PostModel = require('../models/dao').DAO('post');
const PostLogic = require('./post');
const ThreadModel = require('../models/dao').DAO('thread');

let ThreadLogic = module.exports = {};

ThreadLogic.readAllByBoard = async (boardName, {count, page} = {}) => {
  let out = await ThreadModel.readAllByBoard(boardName, {count, page});
  return Tools.parallel(processThread, out);
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

ThreadLogic.sync = async boardName => {
  let out = {};
  let threads = await ThreadModel.readAllByBoard(boardName);
  for (let i = 0; i < threads.length; i++) {
    let { id } = threads[i];
    out[id] = await PostModel.countByThreadId(id);
  }
  return out;
};

async function processThread(thread) {
  if (!thread) {
    throw {
      code: 404
    };
  }
  thread.head = await PostLogic.readOneByThreadId(thread.id);
  thread.posts = await PostModel.countByThreadId(thread.id);
  return thread;
}
