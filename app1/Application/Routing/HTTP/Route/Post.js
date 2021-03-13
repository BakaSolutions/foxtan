const PostBO = require('../../../Business/PostBO.js');
const PostService = require('../../../../Infrastructure/PostService.js');

class PostController {

  constructor(router, DatabaseContext) {
    this.router = router;
    this.post = new PostBO(new PostService(DatabaseContext.post));

    router.post('api/createPost', async ctx => {
      let { body: query, token } = ctx.request;
      // TODO: Token check
      return this.post.create(query);
    });

    router.post('api/deletePost', async ctx => {
      let { body: query, originalBody, token } = ctx.request;
      // TODO: Token check
      return this.post.deleteOne(originalBody);
    });

    router.post('api/deletePosts', async ctx => {
      let { body: query, originalBody, token } = ctx.request;
      // TODO: Token check
      return this.post.deleteMany(originalBody);
    });
  }

}

module.exports = PostController;
