const BoardBO = require('../../../Application/Business/BoardBO.js');
const ThreadBO = require('../../../Application/Business/ThreadBO.js');
const { MissingParamError } = require('../../../Domain/Error/index.js');

class SyncController {

  constructor({ BoardService, PostService, ThreadService }) {
    this.thread = new ThreadBO(ThreadService, PostService);
    this.board = new BoardBO(BoardService);

    return [
      {
        request: 'sync',
        middleware: async params => {
          switch (params.type) {
            case "board":
              return this.board.sync();
            case "thread":
              let { boardName } = params;
              if (!boardName) {
                throw new MissingParamError("boardName is missing");
              }
              return this.thread.sync(boardName);
            default:
              throw new MissingParamError("Define a type for syncing-syncing~");
          }
        }
      }
    ];
  }

}

module.exports = SyncController;
