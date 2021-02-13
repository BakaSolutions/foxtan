const Post = require('../Domain/Post.js');

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
    let { subject, text } = postDTO;
    let post = new Post(subject, text);

    await this._postModel.create(post);

    return post.id;
  }

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

  async readThreadTail(threadId, { count } = {}) {
    let posts = await this._postModel.readByThreadId(threadId, { count, order: 'desc' });
    posts = posts.reverse();
    return posts;
  }

  async readThreadPosts(threadId, { count, page } = {}) {
    return this._postModel.readByThreadId(threadId, { count, page });
  }

  async readBoardFeed(boardName, { count, page } = {}) {
    return this._postModel.readByBoardName(boardName, { count, page, order: 'desc' });
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
