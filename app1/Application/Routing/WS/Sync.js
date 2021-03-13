const BoardBO = require('../../Business/BoardBO.js');
const BoardService = require('../../../Infrastructure/BoardService.js');
const ThreadBO = require('../../Business/ThreadBO.js');
const ThreadService = require('../../../Infrastructure/ThreadService.js');
const PostBO = require('../../Business/PostBO.js');
const PostService = require('../../../Infrastructure/PostService.js');

class SyncController {

  constructor(DatabaseContext) {
    let postService = new PostService(DatabaseContext.post);
    let threadService = new ThreadService(DatabaseContext.thread);
    let boardService = new BoardService(DatabaseContext.board);

    this.post = new PostBO(postService);
    this.thread = new ThreadBO(threadService, postService);
    this.board = new BoardBO(boardService);

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
                throw {
                  message: "MISSING_PARAM",
                  description: "boardName is missing",
                  code: 400
                };
              }
              return this.thread.sync(boardName);
            default:
              throw {
                message: "MISSING_PARAM",
                description: "Define a type for syncing-syncing~",
                code: 400
              };
          }
        }
      }
    ];
  }

}

module.exports = SyncController;
