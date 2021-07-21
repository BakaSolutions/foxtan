const PostBO = require('../../../Application/Business/PostBO.js');
const PostService = require('../../../Application/Service/PostService.js');
const Tools = require('../../../Infrastructure/Tools.js');
const { MissingParamError, PostNotFoundError, DtoError } = require('../../../Domain/Error/index.js');


class PostController {

  constructor(DatabaseContext) {
    this.post = new PostBO(new PostService(DatabaseContext.post));

    return [
      {
        request: 'posts',
        middleware: async params => {
          let { boardName, threadId, count, page } = params;

          let hasPrivileges = false;
          let posts = [];

          switch (true) {
            case !!(threadId && page && page.toLowerCase() === 'tail'):
              // tail (last posts in the thread)
              posts = await this.post.readThreadTail(threadId, {count});
              break;
            case !!(threadId && !boardName):
              // just posts in a thread
              posts = await this.post.readThreadPosts(threadId, {count, page});
              break;
            case !!(!threadId && boardName):
              // feed (last posts on the board)
              posts = await this.post.readBoardFeed(boardName, {count, page});
              break;
            default:
              throw new MissingParamError("threadId or boardName is missing");
          }

          if (!posts.length) {
            throw new PostNotFoundError();
          }

          return this.post.cleanOutput(posts, hasPrivileges);
        }
      }, {
        request: 'post',
        middleware: async (params) => {
          let {
            boardName,
            id,
            number
          } = params;

          id = +id;
          number = +number;

          let hasPrivileges = false;
          let post;

          try {
            switch (true) {
              case !!(Tools.isNumber(id) && id > 0):
                post = await this.post.readOne(id);
                break;
              case !!(boardName && Tools.isNumber(number) && number > 0):
                post = await this.post.readOneByBoardAndPost(boardName, number);
                break;
              default:
                throw new MissingParamError("postId or boardName/number is missing");
            }
          } catch (e) {
            if (e instanceof DtoError) {
              throw new PostNotFoundError();
            }
            throw e;
          }
          return this.post.cleanOutput(post, hasPrivileges);
        }
      }
    ];
  }

}

module.exports = PostController;
