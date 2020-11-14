const PostService = require('../../../../Infrastructure/PostService.js');

class PostController {

  constructor(router, DatabaseContext) {
    this.router = router;
    this.postService = new PostService(DatabaseContext.post);

    router.post('api/createPost', async ctx => {
      let { body: query, token } = ctx.request;
      // TODO: Token check
      return this.postService.create(query);
    });

    router.post('api/deletePost', async ctx => {
      let { body: query, originalBody, token } = ctx.request;
      // TODO: Token check
      return this.postService.deleteOne(originalBody);
    });

    router.post('api/deletePosts', async ctx => {
      let { body: query, originalBody, token } = ctx.request;
      // TODO: Token check
      return this.postService.deleteMany(originalBody);
    });

    return router;
  }

}

module.exports = PostController;