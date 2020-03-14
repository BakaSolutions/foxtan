const ThreadLogic = require('../../logic/thread.js');

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
      let out = await ThreadLogic.readPage(boardName, page, count);
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
