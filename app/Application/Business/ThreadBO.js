const Tools = require('../../Infrastructure/Tools.js');
const { ForbiddenError } = require('../../Domain/Error/index.js');

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

  async pin({ id, priority = null} = {}, session) {
    let thread = await this.ThreadService.readOneById(id);
    let hasPrivileges = await this.can('moderate', thread, session);
    if (!hasPrivileges) {
      throw new ForbiddenError(`You're not allowed to pin this thread`);
    }
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

  async process(thread, posts, head) {
    if (!thread) {
      return null;
    }
    thread.head = head || await this.PostService.readOneByThreadId(thread.id);
    thread.posts = posts || await this.PostService.countByThreadId(thread.id);
    return thread;
  }

  async can(permission, thread, session) {
    if (!thread || !session) {
      return false;
    }
    let isLoggedIn = !!session.user?.id;
    let head = await this.PostService.readOneByThreadId(thread.id);
    if (!isLoggedIn) {
      return session && session.key === head.sessionKey;
    }

    let Member = await this.MemberService.readOneByUserId(session.user?.id);
    let Board = await this.BoardService.readByPostId(head.id);
    let hasPrivileges = await this.AccessService.hasPermissionForBoard(Member?.groupName, Board.name, permission);
    return hasPrivileges
      || (session.key === head.sessionKey)
      || (head.userId > 0 && (session.user?.id === head.userId));
  }

}

module.exports = ThreadBO;
