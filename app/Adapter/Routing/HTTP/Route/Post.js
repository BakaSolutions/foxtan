const BoardBO = require('../../../../Application/Business/BoardBO.js');
const FileBO = require('../../../../Application/Business/FileBO.js');
const PostBO = require('../../../../Application/Business/PostBO.js');
const ThreadBO = require('../../../../Application/Business/ThreadBO.js');
const PostDTO = require('../../../../Domain/DTO/PostDTO.js');
const ThreadDTO = require('../../../../Domain/DTO/ThreadDTO.js');

const MainController = require('../MainController.js');

class PostController extends MainController {

  constructor(Router, Services) {
    super(Router);
    this.board = new BoardBO(Services);
    this.file = new FileBO(Services);
    this.post = new PostBO(Services);
    this.thread = new ThreadBO(Services);

    // Setting up POST methods
    Router.post('api/createPost', this.createPost.bind(this));
    Router.post('api/deletePost', this.deletePost.bind(this));
    Router.post('api/deletePosts', this.deletePosts.bind(this));
  }

  async createPost(ctx) {
    let { body: query } = ctx.request;
    query.userId = ctx.session.user?.id || null;
    query.sessionKey = ctx.session.key || null;

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

      // This doesn't allow `sage` append to thread modifiers.
      // They're empty by default right now. If it's not, rewrite this ASAP.
      threadDTO.modifiers = [];

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
    try {
      let { body: query } = ctx.request;

      let post = this.processSelectedPost(query.selectedPost);
      let session = ctx.session || {};

      let out = await this.post.deleteOne(post, session);
      this.success(ctx, out);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

  async deletePosts(ctx) {
    try {
      let { body: query } = ctx.request;

      let posts = this.processSelectedPosts(query.selectedPost);
      let session = ctx.session || {};

      let out = await this.post.deleteMany(posts, session);
      this.success(ctx, out);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

  processSelectedPost(selectedPost = {}) {
    let key = Object.keys(selectedPost)[0];

    let postId = null;
    let postNumber = {};

    let value = selectedPost[key];
    if (typeof value === 'string') {
      postId = +key;
      return { postId, postNumber };
    }

    if (typeof value === 'object') {
      postNumber[key] = +Object.keys(value)[0];
    }
    return { postId, postNumber };
  }

  processSelectedPosts(selectedPost = {}) {
    let keys = Object.keys(selectedPost);

    let postIds = keys
      .filter(id => typeof selectedPost[id] === 'string') // 'on', 'true' and so on
      .map(id => +id);
    let postNumbers = {};

    let boardNames = keys.filter(boardName => typeof selectedPost[boardName] === 'object');
    for (let boardName of boardNames) {
      postNumbers[boardName] = Object
        .keys(selectedPost[boardName])
        .filter(postNumber => typeof selectedPost[boardName][postNumber] === 'string')
        .map(id => +id);
    }

    return { postIds, postNumbers };
  }

}

module.exports = PostController;
