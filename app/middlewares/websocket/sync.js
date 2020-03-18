const CounterLogic = require('../../logic/counter.js');
const ThreadLogic = require('../../logic/thread.js');

const Controller = require('../../helpers/ws.js')();

module.exports = [
  {
    request: 'sync',
    middleware: async (params, ws) => {
      switch (params.type) {
        case "board":
          return Controller.success(ws, params, await CounterLogic.read());
        case "thread":
          if (!params.boardName) {
            throw {
              message: "MISSING_PARAM",
              description: "boardName is missing",
              code: 400
            };
          }
          return Controller.success(ws, params, await ThreadLogic.syncThread(params.boardName));
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
