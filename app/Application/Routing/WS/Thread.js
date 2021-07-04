const ThreadBO = require('../../Business/ThreadBO.js');
const ThreadService = require('../../../Infrastructure/ThreadService.js');
const PostBO = require('../../Business/PostBO.js');
const PostService = require('../../../Infrastructure/PostService.js');

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
            throw {
              message: "MISSING_PARAM",
              description: "boardName is missing",
              code: 400
            };
          }

          try {
            let threads = await this.thread.readAllByBoard(boardName, {
              count,
              page
            });
            if (!threads || !threads.length) {
              throw new Error("THREADS_NOT_FOUND"); // TODO: This job is for ThreadEntity but we have not got one yet
            }

            return this.thread.cleanOutput(threads, hasPrivileges);
          } catch (e) {
            throw {
              message: "THREADS_NOT_FOUND",
              description: "There is no threads on such page of a board",
              code: 404
            };
          }
        }
     }, {
        request: 'thread',
        middleware: async params => {
          try {
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
                throw {
                  message: "MISSING_PARAM",
                  description: "id or headId or boardName/postNumber is missing",
                  code: 400
                };
            }

            if (!thread) {
              throw new Error("THREAD_NOT_FOUND"); // TODO: This job is for ThreadEntity but we have not got one yet
            }
            return this.thread.cleanOutput(thread, hasPrivileges);
          } catch (e) {
            throw {
              message: "THREAD_NOT_FOUND",
              description: "There is no such a thread",
              code: 404
            };
          }
        }
      }
    ];
  }
}

module.exports = ThreadController;
