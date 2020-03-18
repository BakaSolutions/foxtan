const ThreadModel = require('../../models/mongo/thread.js');
const ThreadLogic = require('../../logic/thread.js');

const Tools = require('../../helpers/tools.js');
const Controller = require('../../helpers/ws.js')();

module.exports = [
  {
    request: 'threads',
    middleware: async (params, ws) => {
      let { boardName, count, page } = params;
      if (!params.boardName) {
        throw {
          message: "MISSING_PARAM",
          description: "boardName is missing",
          code: 400
        };
      }

      let threadArray = await ThreadModel.readPage({boardName, page, limit: count});
      let out = await Tools.sequence(threadArray, ThreadLogic.processThread);
      return Controller.success(ws, params, out);
    }
  }, {
    request: 'thread',
    middleware: async (params, ws) => {
      let { boardName, id } = params;
      ['boardName', 'id'].forEach(param => {
        if (!params[param]) {
          throw {
            message: "MISSING_PARAM",
            description: `${param} is missing`,
            code: 400
          };
        }
      });
      let thread = await ThreadModel.readOne({boardName, threadNumber: id});
      let out = await ThreadLogic.processThread(thread);
      return Controller.success(ws, params, out);
    }
  }
];
