const PostBO = require('../../../../Application/Business/PostBO.js');
const PostService = require('../../../../Application/Service/PostService.js');
const PostDTO = require('../../../../Domain/DTO/PostDTO.js');
const ThreadBO = require('../../../../Application/Business/ThreadBO.js');
const ThreadService = require('../../../../Application/Service/ThreadService.js');
const ThreadDTO = require('../../../../Domain/DTO/ThreadDTO.js');
const BoardBO = require('../../../../Application/Business/BoardBO.js');
const BoardService = require('../../../../Application/Service/BoardService.js');

const { ThreadNotFoundError } = require('../../../../Domain/Error/index.js');

const MainController = require('../MainController.js');

class PostController extends MainController {

  constructor(Router, DatabaseContext) {
    super(Router);
    let postService = new PostService(DatabaseContext.post);
    this.post = new PostBO(postService);
    this.thread = new ThreadBO(new ThreadService(DatabaseContext.thread), postService);
    this.board = new BoardBO(new BoardService(DatabaseContext.board));

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
        let dto = new ThreadDTO(query);
        query.threadId = await this.thread.create(dto);
      } else {
        let thread = await this.thread.readOne(query.threadId);
        if (!thread) {
          throw new ThreadNotFoundError('Thread does not exist!');
        }
        query.boardName = thread.boardName;
      }
      query.created = new Date();
      let lastPostNumber = await this.board.getLastPostNumber(query.boardName);
      query.number = ++lastPostNumber;
      let dto = new PostDTO(query);
      let post = await this.post.create(dto);

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
