const PostBO = require('../../../Business/PostBO.js');
const PostService = require('../../../../Infrastructure/PostService.js');
const ThreadBO = require('../../../Business/ThreadBO.js');
const ThreadService = require('../../../../Infrastructure/ThreadService.js');
const MainController = require('../MainController.js');

class PostController extends MainController {

  constructor(Router, DatabaseContext) {
    super(Router);
    this.post = new PostBO(new PostService(DatabaseContext.post));
    this.thread = new ThreadBO(new ThreadService(DatabaseContext.thread));

    // Setting up POST methods
    Router.post('api/createPost', this.createPost.bind(this));
    Router.post('api/deletePost', this.deletePost.bind(this));
    Router.post('api/deletePosts', this.deletePosts.bind(this));
  }

  async createPost(ctx) {
    let { body: query, token } = ctx.request; // TODO: Token check

    let isANewThread = !(query.threadId);

    try {
      /*if (isANewThread) {
        await this.thread.validate();
      }
      await this.post.validate();*/

      if (isANewThread) {
        // Create a new thread first
        query.threadId = await this.thread.create(query);
      }
      let post = await this.post.create(query);

      this.success(ctx, post);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

  async deletePost(ctx) {
    let { originalBody, token } = ctx.request; // TODO: Token check
    return await this.post.deleteOne(originalBody);
  }

  async deletePosts(ctx) {
    let { originalBody, token } = ctx.request; // TODO: Token check
    return await this.post.deleteMany(originalBody);
  }

}

module.exports = PostController;
