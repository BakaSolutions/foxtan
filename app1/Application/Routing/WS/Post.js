const PostBO = require('../../Business/PostBO.js');
const PostService = require('../../../Infrastructure/PostService.js');

class PostController {

  constructor(DatabaseContext) {
    this.post = new PostBO(new PostService(DatabaseContext.post));

    return [
      {
        request: 'posts',
        middleware: async params => {
          let { boardName, threadId, count, page } = params;
          return this.post.readMany({ boardName, threadId, count, page });
        }
      }, {
        request: 'post',
        middleware: async (params) => {
          let { boardName, id, number } = params;
          let post;

          switch (true) {
            case !!(id):

              break;
            case !!(boardName && number):

              break;
            default:
              throw {
                message: "MISSING_PARAM",
                description: `postId or boardName/number is missing`,
                code: 400
              };
          }

          if (!post) {
            throw {
              code: 404
            }
          }

          return post;
        }
      }
    ];
  }

}

module.exports = PostController;
