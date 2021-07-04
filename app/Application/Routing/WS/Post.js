const PostBO = require('../../Business/PostBO.js');
const PostService = require('../../../Infrastructure/PostService.js');
const Tools = require('../../../Infrastructure/Tools.js');

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
              throw {
                message: "MISSING_PARAM",
                description: "threadId or boardName is missing",
                code: 400
              };
          }

          if (!posts.length) {
            throw {
              code: 404
            }
          }
          return this.post.cleanOutput(posts, hasPrivileges);
        }
      }, {
        request: 'post',
        middleware: async (params) => {
          try {
            let {
              boardName,
              id,
              number
            } = params;

            id = +id;
            number = +number;

            let hasPrivileges = false;
            let post;

            switch (true) {
              case !!(Tools.isNumber(id) && id > 0):
                post = await this.post.readOne(id);
                break;
              case !!(boardName && Tools.isNumber(number) && number > 0):
                post = await this.post.readOneByBoardAndPost(boardName, number);
                break;
              default:
                throw {
                  message: "MISSING_PARAM",
                  description: `postId or boardName/number is missing`,
                  code: 400
                };
            }

            if (!post) {
              throw new Error("POST_NOT_FOUND");
            }

            return this.post.cleanOutput(post, hasPrivileges);
          } catch (e) {
            throw {
              message: "POST_NOT_FOUND",
              description: "There is no such a post",
              code: 404
            }
          }
        }
      }
    ];
  }

}

module.exports = PostController;
