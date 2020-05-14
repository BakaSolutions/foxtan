const ThreadModel = require('../../models/dao').DAO('thread');
const ThreadLogic = require('../../logic/thread.js');

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

      let threads = await ThreadLogic.readAllByBoard(boardName, { count, page });
      return Controller.success(ws, params, threads);
    }
  }, {
    request: 'thread',
    middleware: async (params, ws) => {
      let { id, headId, boardName, postNumber } = params;
      let thread;

      switch (true) {
        case !!id:
          thread = await ThreadLogic.readOneById(id);
          break;
        case !!headId:
          thread = await ThreadLogic.readOneByHeadId(headId);
          break;
        case !!(boardName && postNumber):
          thread = await ThreadLogic.readOneByBoardAndPost(boardName, postNumber);
          break;
        default:
          throw {
            message: "MISSING_PARAM",
            description: "id or headId or boardName/postNumber is missing",
            code: 400
          };
      }

      return Controller.success(ws, params, thread);
    }
  }
];
