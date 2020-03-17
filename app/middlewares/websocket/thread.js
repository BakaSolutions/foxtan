const ThreadModel = require('../../models/mongo/thread.js');
const PostModel = require('../../models/mongo/post.js');

const ThreadLogic = require('../../logic/thread.js');

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

      //TODO: Rewrite this temporary fix for API mismatch
      let threadArray = await ThreadModel.readPage({boardName, page, limit: count});
      let out = await Tools.sequence(threadArray, async thread => {
        delete thread.createdAt;
        delete thread.updatedAt;
        thread.id = thread.number;
        delete thread.number;
        thread.posts = await PostModel.count({
          query: {boardName, threadNumber: thread.id}
        });
        return thread;
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
      let out = await ThreadLogic.readOne(boardName, id);
      return Controller.success(ws, params, out);
    }
  }
];
