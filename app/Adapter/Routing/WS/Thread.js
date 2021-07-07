const ThreadBO = require('../../../Application/Business/ThreadBO.js');
const ThreadService = require('../../../Application/Service/ThreadService.js');
const PostBO = require('../../../Application/Business/PostBO.js');
const PostService = require('../../../Application/Service/PostService.js');
const { MissingParamError, ThreadsNotFoundError, ThreadNotFoundError } = require('../../../Domain/Error/index.js');

class ThreadController {
  constructor(DatabaseContext) {
    let postService = new PostService(DatabaseContext.post);
    let threadService = new ThreadService(DatabaseContext.thread);

    this.post = new PostBO(postService);
    this.thread = new ThreadBO(threadService, postService);

    return [
      {
        request: 'threads',
        middleware: async params => {
          let { boardName, count, page } = params;
          let hasPrivileges = false;

          if (!params.boardName) {
            throw new MissingParamError("boardName is missing");
          }

          let threads = await this.thread.readAllByBoard(boardName, {
            count,
            page
          });
          if (!threads || !threads.length) {
            throw new ThreadsNotFoundError(); // TODO: This job is for ThreadEntity but we have not got one yet
          }

          return this.thread.cleanOutput(threads, hasPrivileges);
        }
     }, {
        request: 'thread',
        middleware: async params => {
          let { id, headId, boardName, postNumber } = params;
          let hasPrivileges = false;
          let thread;

          switch (true) {
            case !!id:
              thread = await this.thread.readOne(id);
              break;
            case !!headId:
              thread = await this.thread.readOneByHeadId(headId);
              break;
            case !!(boardName && postNumber):
              thread = await this.thread.readOneByBoardAndPost(boardName, postNumber);
              break;
            default:
              throw new MissingParamError("id or headId or boardName/postNumber is missing");
          }

          if (!thread) {
            throw new ThreadNotFoundError(); // TODO: This job is for ThreadEntity but we have not got one yet
          }
          return this.thread.cleanOutput(thread, hasPrivileges);
        }
      }
    ];
  }
}

module.exports = ThreadController;
