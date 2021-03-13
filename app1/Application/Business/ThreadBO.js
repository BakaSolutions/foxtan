class ThreadBO {

  constructor(ThreadService, PostService) {
    this.ThreadService = ThreadService;
    this.PostService = PostService;
  }

  async create(thread) {
    return this.ThreadService.create(thread);
  }

  async readOne(id) {
    return this.ThreadService.readOneById(id);
  }

  async readMany({ boardName, threadId, count, page } = {}) {
    return this.ThreadService.readMany({ boardName, threadId, count, page });
  }

  async sync(boardName) {
    let out = {};
    let threads = await this.ThreadService.readAllByBoard(boardName);
    for (let i = 0; i < threads.length; i++) {
      let { id } = threads[i];
      out[id] = await this.PostService.countByThreadId(id);
    }
    return out;
  }

  /*
  async deleteOne(thread) {
    return this.ThreadService.deleteOne(thread);
  }

  async deleteMany(thread) {
    return this.ThreadService.deleteMany(thread);
  }

  addPostsToThread(thread, posts) {
    return this.ThreadService.addPosts(thread, posts);
  }
  */

}

module.exports = ThreadBO;
