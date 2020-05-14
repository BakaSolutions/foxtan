const BoardLogic = require('../../logic/board.js');
const ThreadLogic = require('../../logic/thread.js');

const Controller = require('../../helpers/ws.js')();

module.exports = [
  {
    request: 'sync',
    middleware: async (params, ws) => {
      switch (params.type) {
        case "board":
          return Controller.success(ws, params, await BoardLogic.sync());
        case "thread":
          let { boardName } = params;
          if (!boardName) {
            throw {
              message: "MISSING_PARAM",
              description: "boardName is missing",
              code: 400
            };
          }
          return Controller.success(ws, params, await ThreadLogic.sync(boardName));
        default:
          throw {
            message: "MISSING_PARAM",
            description: "Define a type for syncing-syncing~",
            code: 400
          };
      }
    }
  },
];
