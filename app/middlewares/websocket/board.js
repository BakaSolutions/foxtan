const BoardLogic = require('../../logic/board.js');

const Controller = require('../../helpers/ws.js')();

module.exports = [
  {
    request: 'boards',
    middleware: async (params, ws) => {
      let out = await BoardLogic.readAll();
      return Controller.success(ws, params, out);
    }
  }, {
    request: 'board',
    middleware: async (params, ws) => {
      if (!params.name) {
        return Controller.fail(ws, params, {
          message: "MISSING_PARAM",
          description: "name is missing",
          code: 400
        });
      }
      let out = await BoardLogic.readOne(params.name);
      return Controller.success(ws, params, out);
    }
  }
];
