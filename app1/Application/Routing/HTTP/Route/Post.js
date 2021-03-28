const PostBO = require('../../../Business/PostBO.js');
const PostService = require('../../../../Infrastructure/PostService.js');
const MainController = require('../MainController.js');

class PostController extends MainController {

  constructor(router, DatabaseContext) {
    super();
    this.router = router;
    this.post = new PostBO(new PostService(DatabaseContext.post));

    router.post('api/createPost', async ctx => {
      try {
        let {body: query, token} = ctx.request;
        // TODO: Token check
        let out = await this.post.create(query);
        this.success(ctx, out);
      } catch (e) {
        this.fail(ctx, e);
      }
    });

    router.post('api/deletePost', async ctx => {
      let { body: query, originalBody, token } = ctx.request;
      // TODO: Token check
      return await this.post.deleteOne(originalBody);
    });

    router.post('api/deletePosts', async ctx => {
      let { body: query, originalBody, token } = ctx.request;
      // TODO: Token check
      return await this.post.deleteMany(originalBody);
    });
  }

}

module.exports = PostController;
