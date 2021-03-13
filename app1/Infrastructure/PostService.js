class PostService {

  /**
   *
   * @param {PostModelInterface} PostModel
   */
  constructor(PostModel) {
    this._postModel = PostModel;
  }

  /**
   *
   * @param {PostDTO} postDTO
   * @returns {Promise<Number>} id
   */
  async create(postDTO = {}) {
    if (!postDTO.text && !postDTO.attachments.length) {
      throw new Error('Neither text nor file is present');
    }
    let post = await this._postModel.create(postDTO);

    return post.id;
  }

  /**
   * @param {Number} id
   * @returns {Promise<PostDTO>} post
   */
  async readOneById(id) {
    if (typeof id !== 'number' || isNaN(id)) {
      throw new Error('id must be a Number');
    }
    if (id < 1) {
      throw new Error('id must be more than 0');
    }
    return this._postModel.readOneById(id);
  }
  /**
   * @param {Number} threadId
   * @returns {Promise<PostDTO>} post
   */
  async readOneByThreadId(threadId) {
    if (typeof threadId !== 'number' || isNaN(threadId)) {
      throw new Error('threadId must be a Number');
    }
    if (threadId < 1) {
      throw new Error('threadId must be more than 0');
    }
    return this._postModel.readOneByThreadId(threadId);
  }

  /**
   * @param {String} boardName
   * @param {Number} threadId
   * @param {Number} count
   * @param {Number} page
   * @returns {Promise<Array>} posts
   */
  async readMany({ boardName, threadId, count, page} = {}) {
    let posts = [];

    switch (true) {
      case !!(threadId && page && page.toLowerCase() === 'tail'):
        // tail (last posts in the thread)
        posts = await this.readThreadTail(threadId, {count});
        break;
      case !!(threadId && !boardName):
        // just posts in a thread
        posts = await this.readThreadPosts(threadId, {count, page});
        break;
      case !!(!threadId && boardName):
        // feed (last posts on the board)
        posts = await this.readBoardFeed(boardName, {count, page});
        break;
      default:
        throw {
          message: "MISSING_PARAM",
          description: "threadId or boardName is missing",
          code: 400
        };
    }

    if (!posts.length) {
      throw {
        code: 404
      }
    }
    return posts.map(post => post.toObject());
  }

  /**
   * @param {Number} threadId
   * @param {Number} count
   * @returns {Promise<Array>} posts
   */
  async readThreadTail(threadId, { count } = {}) {
    let posts = await this._postModel.readByThreadId(threadId, { count, order: 'desc' });
    posts = posts.reverse();
    return posts;
  }

  /**
   * @param {Number} threadId
   * @param {Number} count
   * @param {Number} page
   * @returns {Promise<Array>} posts
   */
  async readThreadPosts(threadId, { count, page } = {}) {
    return this._postModel.readByThreadId(threadId, { count, page });
  }

  /**
   * @param {String} boardName
   * @param {Number} count
   * @param {Number} page
   * @returns {Promise<Array>} posts
   */
  async readBoardFeed(boardName, { count, page } = {}) {
    return this._postModel.readByBoardName(boardName, { count, page, order: 'desc' });
  }

  /**
   * @param {Number} threadId
   * @returns {Promise<Number>}
   */
  async countByThreadId(threadId) {
    return this._postModel.countByThreadId(threadId);
  }

  /**
   *
   * @param {Number} post
   * @returns {Promise<boolean>}
   */
  async deleteOne(post) {
    return this._postModel.deleteOne(post);
  }

  /**
   *
   * @param {PostDTO[]} posts
   * @returns {Promise<Number>}
   */
  async deleteMany(posts) {
    return this._postModel.deleteMany(posts);
  }
}

module.exports = PostService;
