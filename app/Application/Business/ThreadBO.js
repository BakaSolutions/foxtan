const Tools = require('../../Infrastructure/Tools.js');

class ThreadBO {

  constructor({ AccessService, BoardService, MemberService, ThreadService, PostService }) {
    this.AccessService = AccessService;
    this.BoardService = BoardService;
    this.MemberService = MemberService;
    this.PostService = PostService;
    this.ThreadService = ThreadService;
  }

  async readOne(id) {
    let thread = await this.ThreadService.readOneById(id);
    return this.process(thread);
  }

  async readOneByHeadId(headId) {
    let thread = await this.ThreadService.readOneByHeadId(headId);
    return this.process(thread);
  }

  async readOneByBoardAndPost(boardName, postNumber) {
    let thread = await this.ThreadService.readOneByBoardAndPost(boardName, postNumber);
    return this.process(thread);
  }

  async readMany({ boardName, threadId, count, page } = {}) {
    let threads = await this.ThreadService.readMany({ boardName, threadId, count, page });
    return Tools.parallel(this.process.bind(this), threads);
  }

  async readAllByBoard(boardName, { count, page } = {}) {
    let threads = await this.ThreadService.readAllByBoard(boardName, { count, page });
    return Tools.parallel(this.process.bind(this), threads);
  }

  async pin({ id, priority = null} = {}) {
    return this.ThreadService.pin({ id, priority });
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
  */

  async process(thread, posts, head) {
    if (!thread) {
      return null;
    }
    thread.head = head || await this.PostService.readOneByThreadId(thread.id);
    thread.posts = posts || await this.PostService.countByThreadId(thread.id);
    return thread;
  }

  cleanOutput(thread, hasPrivileges) {
    if (Array.isArray(thread)) {
      return thread.map(t => this.cleanOutput(t, hasPrivileges));
    }
    thread.head = thread.head.toObject(hasPrivileges);
    return thread.toObject(hasPrivileges);
  }


}

module.exports = ThreadBO;
