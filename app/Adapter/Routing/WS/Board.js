const BoardBO = require('../../../Application/Business/BoardBO.js');
const BoardService = require('../../../Application/Service/BoardService.js');

class BoardController {

  constructor(DatabaseContext) {
    let boardService = new BoardService(DatabaseContext.board);

    this.board = new BoardBO(boardService);

    return [
      {
        request: 'boards',
        middleware: async params => {
          let { count, page } = params;
          let out = await this.board.readMany({
            count,
            page,
            asObject: true
          });

          for (let boardName in out) {
            let limits = {}; // TODO: Limits
            out[boardName] = this.shape(out[boardName], limits)
          }

          return out;
        }
      }, {
        request: 'board',
        middleware: async params => {
          let { name } = params;
          if (!name) {
            throw {
              message: "MISSING_PARAM",
              description: "name is missing",
              code: 400
            };
          }
          try {
            let board = await this.board.readOne(name);
            let limits = {}; // TODO: Limits

            return this.shape(board, limits);
          } catch (e) {
            throw {
              message: "BOARD_NOT_FOUND",
              description: "There is no such a board",
              code: 404
            }
          }
        }
      }
    ];
  }

  shape(boardObject, limitsObject) {
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

}

module.exports = BoardController;
