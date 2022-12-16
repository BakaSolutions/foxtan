const BoardBO = require('../../../../Application/Business/BoardBO.js');
const PostBO = require('../../../../Application/Business/PostBO.js');
const ThreadBO = require('../../../../Application/Business/ThreadBO.js');
const PostDTO = require('../../../../Domain/DTO/PostDTO.js');
const ThreadDTO = require('../../../../Domain/DTO/ThreadDTO.js');

const MainController = require('../MainController.js');
const { BadRequestError } = require("../../../../Domain/Error/index.js");

class PostController extends MainController {

  constructor(Router, Services) {
    super(Router);
    this.board = new BoardBO(Services);
    this.post = new PostBO(Services);
    this.thread = new ThreadBO(Services);

    // Setting up POST methods
    Router.post('api/createPost', this.createPost.bind(this));
    Router.post('api/deletePost', this.deletePost.bind(this));
    Router.post('api/deletePosts', this.deletePosts.bind(this));
  }

  async createPost(ctx) {
    let { body: query } = ctx.request;
    let { user, key, trustedPostCount } = ctx.session;
    query.userId = user?.id || null;
    query.sessionKey = key || null;

    if (!trustedPostCount || trustedPostCount < 0) {
      throw new BadRequestError('You need to solve a captcha first')
    }

    try {
      let isANewThread = !(query.threadId),
        threadDTO = new ThreadDTO(query),
        postDTO = new PostDTO(query);

      if ("file" in query) {
        postDTO.file = Object.values(query.file);

        let fileMark = [];
        if ("fileMark" in query) {
          for (let i of Object.keys(query.file)) {
            fileMark[fileMark.length] = this.getModifiers(query.fileMark[i]);
          }
        }
        postDTO.fileMark = fileMark;
      }

      postDTO.modifiers = this.getModifiers(postDTO.modifiers);

      // This doesn't allow [`sage`, `signed`, `OP`] append to thread modifiers.
      // They're empty by default right now. If it's not, rewrite this ASAP.
      threadDTO.modifiers = [];

      if (!isANewThread) {
        threadDTO = await this.thread.readOne(postDTO.threadId);
        let { head } = threadDTO;
        if ((head.sessionKey !== postDTO.sessionKey) || (head.userId !== postDTO.userId)) {
          delete postDTO.modifiers['OP'];
        }
      } else {
        //await this.thread.validate();
      }
      /*await this.post.validate();*/ // TODO: Input validation

      postDTO.number = await this.board.incrementLastPostNumber(threadDTO.boardName);

      if (!isANewThread) {
        threadDTO = null;
      }

      let post = await this.post.create(postDTO, threadDTO);

      let out = {
        id: post.id,
        threadId: post.threadId,
        number: post.number
      };
      ctx.session.trustedPostCount -= 1;
      this.success(ctx, out);
    } catch (e) {
      this.fail(ctx, e);
    }
  }

  /**
   * @example Receives object params like {"sage": "on"} and transforms into ["sage"]
   * @param {Object} query
   * @returns {String[]}
   */
  getModifiers(query) {
    if (!query || !(query instanceof Object)) {
      return [];
    }
    return Object.entries(query)
      .map(([key, value]) => {
        if (typeof value === 'string') { // 'on', 'true' and so on
          return key;
        }
      })
      .filter(Boolean);
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
