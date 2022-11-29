const BoardBO = require('../../../Application/Business/BoardBO.js');
const { MissingParamError, BoardNotFoundError, BadRequestError } = require('../../../Domain/Error/index.js');

class BoardController {

  constructor(Services) {
    this.board = new BoardBO(Services);

    return [
      {
        request: 'boards',
        middleware: async params => {
          let { count, page } = params;

          count = +count;
          page = +page;

          if (count < 1 || page < 0) {
            throw new BadRequestError();
          }

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
            throw new MissingParamError("name is missing");
          }
          try {
            let board = await this.board.readOne(name);
            let limits = {}; // TODO: Limits

            return this.shape(board, limits);
          } catch (e) {
            throw new BoardNotFoundError();
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
