const Tools = require('../../Infrastructure/Tools.js');

class PostBO {

  constructor(PostService) {
    this.PostService = PostService;
  }

  async create(postDTO) {
    return this.PostService.create(postDTO);
  }

  async readOne(id) {
    let post = await this.PostService.readOneById(id);
    return this.process(post);
  }

  async readOneByBoardAndPost(boardName, postNumber) {
    let post = await this.PostService.readOneByBoardAndPost(boardName, postNumber);
    return this.process(post);
  }

  async readThreadTail(threadId, { count } = {}) {
    let posts = await this.PostService.readThreadTail(threadId, { count });
    return Tools.parallel(this.process.bind(this), posts);
  }

  async readThreadPosts(threadId, { count, page } = {}) {
    let posts = await this.PostService.readThreadPosts(threadId, { count, page });
    return Tools.parallel(this.process.bind(this), posts);
  }

  async readBoardFeed(boardName, { count, page } = {}) {
    let posts = await this.PostService.readBoardFeed(boardName, { count, page });
    return Tools.parallel(this.process.bind(this), posts);
  }

  /*
  async deleteOne(post) {
    return this.PostService.deleteOne(post);
  }

  async deleteMany(posts) {
    return this.PostService.deleteMany(posts);
  }
  */

  process(post, attachments) {
    if (!post) {
      return;
    }
    post.attachments = attachments || [];// TODO: Add attachments
    return post;
  }

  cleanOutput(post, hasPrivileges) {
    if (Array.isArray(post)) {
      return post.map(p => this.cleanOutput(p, hasPrivileges));
    }
    return post.toObject(hasPrivileges);
  }

}

module.exports = PostBO;