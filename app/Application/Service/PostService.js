const {
  MissingParamError,
  PostNotFoundError,
  PostsNotFoundError,
  BadRequestError
} = require('../../Domain/Error/index.js');
const PostDTO = require('../../Domain/DTO/PostDTO.js');


class PostService {

  /**
   * @param {PostModelInterface} PostModel
   */
  constructor(PostModel) {
    this._postModel = PostModel;
  }

  /**
   * @param {PostDTO} postDTO
   * @returns {Promise<PostDTO>}
   */
  async create(postDTO) {
    if (!postDTO.text && (!postDTO.attachments || !postDTO.attachments.length)) {
      throw new MissingParamError('Neither text nor file is present');
    }
    postDTO.created = new Date();
    return this._postModel.create(postDTO);
  }

  /**
   * @param {Number} id
   * @returns {Promise<PostDTO>} post
   */
  async readOneById(id) {
    if (typeof id !== 'number' || isNaN(id)) {
      throw new BadRequestError('id must be a Number');
    }
    if (id < 1) {
      throw new BadRequestError('id must be more than 0');
    }
    try {
      return await this._postModel.readOneById(id);
    } catch (e) {
      throw new PostNotFoundError();
    }
  }

  /**
   * @param {Number} threadId
   * @returns {Promise<PostDTO>} post
   */
  async readOneByThreadId(threadId) {
    if (typeof threadId !== 'number' || isNaN(threadId)) {
      throw new BadRequestError('threadId must be a Number');
    }
    if (threadId < 1) {
      throw new BadRequestError('threadId must be more than 0');
    }
    try {
      return await this._postModel.readOneByThreadId(threadId);
    } catch (e) {
      throw new PostNotFoundError();
    }
  }

  /**
   * @param {String} boardName
   * @param {Number} number
   * @returns {Promise<PostDTO>} post
   */
  async readOneByBoardAndPost(boardName, number) {
    if (!boardName) {
      throw new BadRequestError('boardName is required');
    }
    if (typeof number !== 'number' || isNaN(number)) {
      throw new BadRequestError('number must be a Number');
    }
    if (number < 1) {
      throw new BadRequestError('number must be more than 0');
    }
    try {
      return await this._postModel.readOneByBoardAndPost(boardName, number);
    } catch (e) {
      throw new PostNotFoundError();
    }
  }

  async readOneByReply(Reply) {
    if (!Reply) {
      throw new BadRequestError("No reply was provided");
    }
    try {
      return await this._postModel.readOneById(Reply.fromId);
    } catch (e) {
      throw new PostNotFoundError();
    }
  }

  async readMany(boardName, number) {
    if (!boardName) {
      throw new BadRequestError('boardName is required');
    }
    if (typeof number === 'number') {
      return this.readOneByBoardAndPost(boardName, number);
    }
    try {
      return await this._postModel.readManyByBoardAndPosts(boardName, number);
    } catch (e) {
      throw new PostsNotFoundError();
    }
  }

  /**
   * @param {Number} threadId
   * @param {Number} count
   * @returns {Promise<Array>} posts
   */
  async readThreadTail(threadId, { count } = {}) {
    try {
      let posts = await this._postModel.readByThreadId(threadId, { count, order: 'desc' });
      posts = posts.reverse();
      return posts;
    } catch (e) {
      throw new PostNotFoundError();
    }
  }

  /**
   * @param {Number} threadId
   * @param {Number} count
   * @param {Number} page
   * @returns {Promise<Array>} posts
   */
  async readThreadPosts(threadId, { count, page } = {}) {
    try {
      return await this._postModel.readByThreadId(threadId, { count, page });
    } catch (e) {
      throw new PostNotFoundError();
    }
  }

  /**
   * @param {String} boardName
   * @param {Number} count
   * @param {Number} page
   * @param {String} order
   * @returns {Promise<Array>} posts
   */
  async readBoardFeed(boardName, { count, page, order } = {}) {
    try {
      order ??= 'desc';
      return await this._postModel.readByBoardName(boardName, { count, page, order });
    } catch (e) {
      throw new PostNotFoundError();
    }
  }

  /**
   * @param {Number} threadId
   * @returns {Promise<Number>}
   */
  async countByThreadId(threadId) {
    return this._postModel.countByThreadId(threadId);
  }

  /**
   * @param {String} boardName
   * @returns {Promise<Number>}
   */
  async countByBoardName(boardName) {
    return this._postModel.countByBoardName(boardName);
  }

  /**
   * @param {hash} hash
   * @returns {Promise<Array>} posts
   */
  async readByAttachmentHash(hash) {
    return this._postModel.readByAttachmentHash(hash);
  }

  /**
   * @param {PostDTO} post
   * @returns {boolean}
   */
  isThreadHead(post) {
    return post?.isHead === true;
  }

  /**
   * @param post
   * @returns {Array} replies: [[wholeMatch, boardName, postNumber], ...]
   */
  parseReplies(post) {
    return post?.text.matchAll(/>>(?:\/?(.+)\/)?([0-9]+)/g) ?? [];
  }

  /**
   * @param {Number} post
   * @returns {Promise<boolean>}
   */
  async deleteOne(post) {
    return this._postModel.deleteOne(post);
  }

  /**
   * @param {PostDTO[]} posts
   * @returns {Promise<Number>}
   */
  async deleteMany(posts) {
    return this._postModel.deleteMany(posts);
  }
}

module.exports = PostService;
