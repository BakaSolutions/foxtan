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
    if (!postDTO.text && (!postDTO.attachments || !postDTO.attachments.length)) {
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
   * @param {Number} number
   * @returns {Promise<PostDTO>} post
   */
  async readOneByBoardAndPost(boardName, number) {
    if (!boardName) {
      throw new Error('boardName is required');
    }
    if (typeof number !== 'number' || isNaN(number)) {
      throw new Error('number must be a Number');
    }
    if (number < 1) {
      throw new Error('number must be more than 0');
    }
    return this._postModel.readOneByBoardAndPost(boardName, number);
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
