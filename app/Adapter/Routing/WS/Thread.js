const ThreadBO = require('../../../Application/Business/ThreadBO.js');
const ThreadService = require('../../../Application/Service/ThreadService.js');
const PostBO = require('../../../Application/Business/PostBO.js');
const PostService = require('../../../Application/Service/PostService.js');
const FileService = require('../../../Application/Service/FileService.js');
const AccessService = require('../../../Application/Service/AccessService.js');
const BoardService = require('../../../Application/Service/BoardService.js');
const MemberService = require('../../../Application/Service/MemberService.js');
const { MissingParamError, ThreadsNotFoundError, ThreadNotFoundError, DtoError, BadRequestError } = require('../../../Domain/Error/index.js');

const Tools = require('../../../Infrastructure/Tools.js');

class ThreadController {
  constructor(DatabaseContext) {
    let postService = new PostService(DatabaseContext.post);
    let threadService = new ThreadService(DatabaseContext.thread);
    let fileService = new FileService(DatabaseContext.file);
    let accessService = new AccessService(DatabaseContext.access);
    let boardService = new BoardService(DatabaseContext.board);
    let memberService = new MemberService(DatabaseContext.member);

    this.post = new PostBO({
      AccessService: accessService,
      MemberService: memberService,
      BoardService: boardService,
      ThreadService: threadService,
      PostService: postService,
      FileService: fileService,
    });
    this.thread = new ThreadBO(threadService, postService);

    return [
      {
        request: 'threads',
        middleware: async params => {
          let { boardName, count, page } = params;
          let hasPrivileges = false;

          if (!boardName) {
            throw new MissingParamError("boardName is missing");
          }

          count = +count;
          page = +page;

          if (count < 1 || page < 0) {
            throw new BadRequestError();
          }

          let threads = await this.thread.readAllByBoard(boardName, {
            count,
            page
          });
          if (!threads || !threads.length) {
            throw new ThreadsNotFoundError(); // TODO: This job is for ThreadEntity but we have not got one yet
          }

          threads = await Tools.parallel(async thread => {
            thread.head = await this.post.process(thread.head);
            return thread;
          }, threads);

          return this.thread.cleanOutput(threads, hasPrivileges);
        }
     }, {
        request: 'thread',
        middleware: async params => {
          let { id, headId, boardName, postNumber } = params;
          let hasPrivileges = false;
          let thread;

          try {
            switch (true) {
              case !!id:
                id = +id;
                if (id < 1) {
                  throw new BadRequestError("Id must not be lower than 1");
                }
                thread = await this.thread.readOne(id);
                break;
              case !!headId:
                headId = +headId;
                if (headId < 1) {
                  throw new BadRequestError("headId must not be lower than 1");
                }
                thread = await this.thread.readOneByHeadId(headId);
                break;
              case !!(boardName && postNumber):
                postNumber = +postNumber;
                if (postNumber < 1) {
                  throw new BadRequestError("Post number not be lower than 1");
                }
                thread = await this.thread.readOneByBoardAndPost(boardName, postNumber);
                break;
              default:
                throw new MissingParamError("id or headId or boardName/postNumber is missing");
            }
          } catch (e) {
            if (e instanceof DtoError) {
              throw new ThreadNotFoundError(); // TODO: This job is for ThreadEntity but we have not got one yet
            }
            throw e;
          }
          
          thread.head = await this.post.process(thread.head);

          return this.thread.cleanOutput(thread, hasPrivileges);
        }
      }, {
        request: 'pinThread',
        middleware: async params => {
          let { id, priority } = params;
          if (priority <= 0) {
            priority = null;
          }
          return this.thread.pin({id, priority});
        }
      }
    ];
  }
}

module.exports = ThreadController;
