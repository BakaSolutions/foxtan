const BoardLogic = require('../../logic/board.js');

const Controller = require('../../helpers/ws.js')();

function shape(boardObject, limitsObject) {
  return {
    name: boardObject.name,
    title: boardObject.title || '',
    description: boardObject.description || '',
    limits: {
      threadsPerMinute: limitsObject.threadsPerMinute,
      postsPerMinute: limitsObject.postsPerMinute,
      threadBumps: limitsObject.threadBumps,
      postFiles: limitsObject.postFiles,
      postFileSize: limitsObject.postFileSize,
      postTotalFileSize: limitsObject.postTotalFileSize,
      postCharactersTop: limitsObject.postCharactersTop
    },
    modifiers: boardObject.modifiers || []
  }
}

module.exports = [
  {
    request: 'boards',
    middleware: async (params, ws) => {
      let out = await BoardLogic.readAll();

      for (let boardName in out) {
        let limits = {} // TODO: Limits
        out[boardName] = shape(out[boardName], limits)
      }

      return Controller.success(ws, params, out);
    }
  }, {
    request: 'board',
    middleware: async (params, ws) => {
      if (!params.name) {
        throw {
          message: "MISSING_PARAM",
          description: "name is missing",
          code: 400
        };
      }
      let out = await BoardLogic.readOne(params.name);
      let limits = {} // TODO: Limits

      return Controller.success(ws, params, shape(out, limits));
    }
  }
];
