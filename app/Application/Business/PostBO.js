const Tools = require('../../Infrastructure/Tools.js');

class PostBO {

  /**
   *
   * @param {PostService} PostService
   * @param {ThreadService} ThreadService
   * @param {FileService} FileService
   */
  constructor(PostService, ThreadService, FileService) {
    if (!PostService) {
      throw new Error('No PostService');
    }
    this.PostService = PostService;
    this.ThreadService = ThreadService;
    this.FileService = FileService;
  }

  /**
   * @param {PostDTO} postDTO
   * @param {ThreadDTO} threadDTO
   */
  async create(postDTO, threadDTO) {
    if (threadDTO) {
      let thread = await this.ThreadService.create(threadDTO);
      postDTO.threadId = thread.id;
    }
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

  async readThreadPosts(threadId, { count, page } = {}) {
    let posts = page >= 0
      ? await this.PostService.readThreadPosts(threadId, { count, page })
      : await this.PostService.readThreadTail(threadId, { count });
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

  async process(post) {
    if (!post) {
      return;
    }

    if (post.attachments?.length > 0) {
      post.attachments = await this.FileService.read(post.attachments);
    }

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
