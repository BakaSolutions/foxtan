const PostBO = require('../../../Application/Business/PostBO.js');
const Tools = require('../../../Infrastructure/Tools.js');
const { MissingParamError, PostNotFoundError, DtoError, BadRequestError } = require('../../../Domain/Error/index.js');


class PostController {

  constructor(Services) {
    this.post = new PostBO(Services);

    return [
      {
        request: 'posts',
        middleware: async params => {
          let { boardName, threadId, count, page } = params;

          let hasPrivileges = false;
          let posts = [];

          count = +count;
          if (count < 1) {
            throw new BadRequestError("Count must not be lower than 1");
          }

          switch (true) {
            case !!(threadId && !boardName):
              // just posts in a thread
              page = +page;
              posts = await this.post.readThreadPosts(threadId, {count, page});
              break;
            case !!(!threadId && boardName):
              // feed (last posts on the board)
              page = +page;
              if (page < 0) {
                throw new BadRequestError("Page must not be lower than 0");
              }
              posts = await this.post.readBoardFeed(boardName, {count, page});
              break;
            default:
              throw new MissingParamError("threadId or boardName is missing");
          }

          if (!posts.length) {
            throw new PostNotFoundError();
          }

          return posts.map(post => post.cleanOutput(hasPrivileges));
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
              case !!(Tools.isNumber(id)):
                if (id < 1) {
                  throw new BadRequestError("id must not be lower than 1");
                }
                post = await this.post.readOne(id);
                break;
              case !!(boardName && Tools.isNumber(number)):
                if (number < 1) {
                  throw new BadRequestError("Post number must not be lower than 1");
                }
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
          return post.cleanOutput(hasPrivileges);
        }
      },
      {
        request: 'postEdit',
        middleware: async (params, ws) => {
          try {
            let { postId, data } = params;
            if (!Tools.isNumber(postId)) {
              throw new BadRequestError("postId must be a Number");
            }
            if (postId < 1) {
              throw new BadRequestError("postId must not be lower than 1");
            }
            return await this.post.edit(postId, data, ws.session);
          } catch (e) {
            if (e instanceof DtoError) {
              throw new PostNotFoundError();
            }
            throw e;
          }
        }
      }
    ];
  }

}

module.exports = PostController;
