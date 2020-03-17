const ThreadModel = require('../../models/mongo/thread.js');
const PostModel = require('../../models/mongo/post.js');

const PostLogic = require('../../logic/post.js');

const Tools = require('../../helpers/tools.js');
const Controller = require('../../helpers/ws.js')();

module.exports = [
  {
    request: 'threads',
    middleware: async (params, ws) => {
      let { boardName, count, page } = params;
      if (!params.boardName) {
        return Controller.fail(ws, params, {
          message: "MISSING_PARAM",
          description: "boardName is missing",
          code: 400
        });
      }

      let threadArray = await ThreadModel.readPage({boardName, page, limit: count});
      let out = await Tools.sequence(threadArray, async thread => {
        return await processThread(boardName, thread);
      });

      return Controller.success(ws, params, out);
    }
  }, {
    request: 'thread',
    middleware: async (params, ws) => {
      let { boardName, id } = params;
      if (!boardName) {
        return Controller.fail(ws, params, {
          message: "MISSING_PARAM",
          description: "boardName is missing",
          code: 400
        });
      }
      if (!id) {
        return Controller.fail(ws, params, {
          message: "MISSING_PARAM",
          description: "id is missing",
          code: 400
        });
      }
      let thread = await ThreadModel.readOne({boardName, threadNumber: id});
      let out = await processThread(boardName, thread);
      return Controller.success(ws, params, out);
    }
  }
];

//TODO: Remove this temporary fix for API mismatch
async function processThread(boardName, thread) {
  delete thread.createdAt;
  delete thread.updatedAt;
  thread.id = thread.number;
  delete thread.number;
  thread.head = await PostLogic.readOne({
    boardName,
    postNumber: thread.id
  });
  thread.head.text = thread.head.rawText;
  delete thread.head.rawText;
  thread.head.attachments = thread.head.files;
  delete thread.head.files;
  thread.head.modifiers = [];
  ['sage', 'op'].forEach(bool => {
    if (thread.head[bool]) {
      delete thread.head[bool];
      thread.head.modifiers.push(bool);
    }
  });
  thread.posts = await PostModel.count({
    query: {boardName, threadNumber: thread.id}
  });
  thread.modifiers = [];
  ['pinned', 'closed', 'frozen'].forEach(bool => {
    if (thread[bool]) {
      delete thread[bool];
      thread.modifiers.push(bool);
    }
  });
  return thread;
}
