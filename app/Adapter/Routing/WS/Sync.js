const BoardBO = require('../../../Application/Business/BoardBO.js');
const BoardService = require('../../../Application/Service/BoardService.js');
const ThreadBO = require('../../../Application/Business/ThreadBO.js');
const ThreadService = require('../../../Application/Service/ThreadService.js');
const PostBO = require('../../../Application/Business/PostBO.js');
const PostService = require('../../../Application/Service/PostService.js');
const AccessService = require('../../../Application/Service/AccessService.js');
const FileService = require('../../../Application/Service/FileService.js');
const MemberService = require('../../../Application/Service/MemberService.js');
const { MissingParamError } = require('../../../Domain/Error/index.js');

class SyncController {

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
