const PostBO = require('../../../../Application/Business/PostBO.js');
const PostService = require('../../../../Application/Service/PostService.js');
const PostDTO = require('../../../../Domain/DTO/PostDTO.js');
const ThreadBO = require('../../../../Application/Business/ThreadBO.js');
const ThreadService = require('../../../../Application/Service/ThreadService.js');
const ThreadDTO = require('../../../../Domain/DTO/ThreadDTO.js');
const BoardBO = require('../../../../Application/Business/BoardBO.js');
const BoardService = require('../../../../Application/Service/BoardService.js');

const MainController = require('../MainController.js');

class PostController extends MainController {

  constructor(Router, DatabaseContext) {
    super(Router);
    let postService = new PostService(DatabaseContext.post);
    let threadService = new ThreadService(DatabaseContext.thread);
    let boardService = new BoardService(DatabaseContext.board);
    this.post = new PostBO(postService, threadService);
    this.thread = new ThreadBO(threadService, postService);
    this.board = new BoardBO(boardService);

    // Setting up POST methods
    Router.post('api/createPost', this.createPost.bind(this));
    Router.post('api/deletePost', this.deletePost.bind(this));
    Router.post('api/deletePosts', this.deletePosts.bind(this));
  }

  async createPost(ctx) {
    let { body: query, token } = ctx.request; // TODO: Token check

    try {
      let isANewThread = !(query.threadId),
        threadDTO = new ThreadDTO(query),
        postDTO = new PostDTO(query);

      /*if (isANewThread) {
        await this.thread.validate();
      }
      await this.post.validate();*/ // TODO: Input validation

      if (!isANewThread) {
        threadDTO = await this.thread.readOne(postDTO.threadId);
      }

      let lastPostNumber = await this.board.getLastPostNumber(threadDTO.boardName);
      postDTO.number = ++lastPostNumber;

      if (!isANewThread) {
        threadDTO = null;
      }

      let post = await this.post.create(postDTO, threadDTO);

      let out = {
        id: post.id,
        threadId: post.threadId,
        number: post.number
      };
      this.success(ctx, out);
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
