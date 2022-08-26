const BoardBO = require('../../../../Application/Business/BoardBO.js');
const FileBO = require('../../../../Application/Business/FileBO.js');
const PostBO = require('../../../../Application/Business/PostBO.js');
const ThreadBO = require('../../../../Application/Business/ThreadBO.js');
const BoardService = require('../../../../Application/Service/BoardService.js');
const FileService = require('../../../../Application/Service/FileService.js');
const PostService = require('../../../../Application/Service/PostService.js');
const ThreadService = require('../../../../Application/Service/ThreadService.js');
const PostDTO = require('../../../../Domain/DTO/PostDTO.js');
const ThreadDTO = require('../../../../Domain/DTO/ThreadDTO.js');

const MainController = require('../MainController.js');

class PostController extends MainController {

  constructor(Router, DatabaseContext) {
    super(Router);
    let boardService = new BoardService(DatabaseContext.board);
    let fileService = new FileService(DatabaseContext.file);
    let postService = new PostService(DatabaseContext.post);
    let threadService = new ThreadService(DatabaseContext.thread);
    this.board = new BoardBO(boardService);
    this.file = new FileBO(fileService);
    this.post = new PostBO(postService, threadService, fileService);
    this.thread = new ThreadBO(threadService, postService);

    // Setting up POST methods
    Router.post('api/createPost', this.createPost.bind(this));
    Router.post('api/deletePost', this.deletePost.bind(this));
    Router.post('api/deletePosts', this.deletePosts.bind(this));
  }

  async createPost(ctx) {
    let { body: query } = ctx.request;
    query.userId = ctx.session.user?.id || null;

    try {
      let isANewThread = !(query.threadId),
        threadDTO = new ThreadDTO(query),
        postDTO = new PostDTO(query);

      function getModifierList(i) {
        const strI = String(i);

        if (!('fileMark' in query) || !(strI in query.fileMark)) {
          return [];
        }

        return Object.entries(query.fileMark[strI])
          .map(([key, value]) => {
            if ('true' === value) {
              return key;
            }
          })
      }

      if ("file" in query) {
        const files = await Promise.all(Object.values(query.file)
          .map((f, i) => (
            this.file.create(f, getModifierList(i))
          ))
        );
        postDTO.attachments = files.map(f => f.hash);
      }

      postDTO.modifiers = Object.entries(postDTO.modifiers)
        .map(([key, value]) => {
          if ('true' === value) {
            return key;
          }
        })

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
    let { originalBody } = ctx.request;
    return await this.post.deleteOne(originalBody);
  }

  async deletePosts(ctx) {
    let { originalBody } = ctx.request;
    return await this.post.deleteMany(originalBody);
  }

}

module.exports = PostController;
