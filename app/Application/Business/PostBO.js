const Tools = require('../../Infrastructure/Tools.js');
const EventBus = require('../../Infrastructure/EventBus.js');
const { ForbiddenError } = require('../../Domain/Error/index.js');

class PostBO {

  /**
   *
   * @param {AccessService} AccessService
   * @param {BoardService} BoardService
   * @param {FileService} FileService
   * @param {MemberService} MemberService
   * @param {PostService} PostService
   * @param {ThreadService} ThreadService
   */
  constructor({ AccessService, BoardService, FileService, MemberService, PostService, ThreadService }) {
    this.AccessService = AccessService;
    this.BoardService = BoardService;
    this.FileService = FileService;
    this.MemberService = MemberService;
    this.PostService = PostService;
    this.ThreadService = ThreadService;
  }

  async createPreHook(postDTO, threadDTO) {
    if (!threadDTO) {
      return [postDTO, undefined];
    }

    const thread = await this.ThreadService.create(threadDTO);
    postDTO.threadId = thread.id;
    postDTO.isHead = true;
    return [postDTO, thread]
  }

  /**
   * @param {PostDTO} postDTO
   * @param {ThreadDTO} threadDTO
   */
  async create(postDTO, threadDTO) {
    if ("file" in postDTO) {
      let filePromises = postDTO.file.map(async (file, i) => {
        return this.FileService.create(file, postDTO.fileMark[i])
      });
      let files = await Promise.all(filePromises);
      postDTO.attachments = files.map(f => f.hash);
      delete postDTO.file;
      delete postDTO.fileMark;
    }

    [postDTO, threadDTO] = await this.createPreHook(postDTO, threadDTO);
    let Post = await this.PostService.create(postDTO);
    return this.createPostHook(Post, threadDTO);
  }

  async createPostHook(Post, threadDTO) {
    Post = await this.process(Post);
    Post = this.cleanOutput(Post);

    if (threadDTO) {
      EventBus.emit('broadcast', 'thread', 'created', {
        ...(await this.ThreadService.readOneById(threadDTO.id)),
        head: Post,
        posts: 1,
      });
    } else {
      EventBus.emit('broadcast', 'post', 'created', Post);
    }

    return Post;
  }

  async readOne(id) {
    let post = await this.PostService.readOneById(id);
    return this.process(post);
  }

  async readOneByBoardAndPost(boardName, postNumber) {
    let post = await this.PostService.readOneByBoardAndPost(boardName, postNumber);
    return this.process(post);
  }

  async readMany(ids = []) {
    return await Promise.all(ids.map(async id => await this.readOne(id)));
  }

  async readManyByBoardAndPost(postObject = {}) {
    let boards = Object.keys(postObject);
    let posts = [];
    await Tools.parallel(async boardName => {
      let portionOfPosts = await this.PostService.readMany(boardName, postObject[boardName]);
      posts = posts.concat(portionOfPosts);
    }, boards);
    return Tools.parallel(this.process.bind(this), posts);
  }

  async readThreadPosts(threadId, { count, page } = {}) {
    let posts = page >= 0
      ? await this.PostService.readThreadPosts(threadId, { count, page })
      : await this.PostService.readThreadTail(threadId, { count });
    return Tools.parallel(this.process.bind(this), posts);
  }

  async readBoardFeed(boardName, { count, page, order } = {}) {
    let posts = await this.PostService.readBoardFeed(boardName, { count, page, order });
    return Tools.parallel(this.process.bind(this), posts);
  }

  async countByBoardName(boardName) {
    return await this.PostService.countByBoardName(boardName) ?? 0;
  }

  async edit(postId, data, session) {
    let post = await this.PostService.readOneById(postId);
    let hasPrivileges = await this.can('moderate', post, session);
    if (!hasPrivileges) {
      throw new ForbiddenError(`You're not allowed to edit this post`);
    }
    // await this.PostService.update(postId, data);
    // TODO: Post editing
    return true;
  }

  async deleteOne({ postId, postNumber }, session) {
    let post = postId > 0
      ? await this.readOne(postId)
      : await this.readOneByBoardAndPost(...Object.entries(postNumber));

    let canDelete = await this.canDelete(post, session);
    if (!canDelete) {
      throw new ForbiddenError(`You're not allowed to delete this post`);
    }

    let isThread = await this.PostService.isThreadHead(post);
    if (isThread) {
      let thread = await this.ThreadService.readOneById(post.threadId);
      await this.ThreadService.deleteOne(thread);
      delete thread.head;
      delete thread.posts;
      EventBus.emit('broadcast', 'thread', 'deleted', thread);
      let threadPosts = await this.PostService.readThreadPosts(post.threadId);
      let postsForDeletion = [post, ...threadPosts];
      await Tools.parallel(this.deleteAttachments.bind(this), postsForDeletion);
      return await this.PostService.deleteMany(postsForDeletion);
    }

    let isDeleted = await this.PostService.deleteOne(post);
    await this.deleteAttachments(post);
    EventBus.emit('broadcast', 'post', 'deleted', post);
    return isDeleted;
  }

  async deleteMany({ postIds, postNumbers }, session) {
    let posts = postIds?.length > 0
      ? await this.readMany(postIds)
      : await this.readManyByBoardAndPost(postNumbers);

    let canDelete = await Tools.parallel(this.canDelete.bind(this), posts, session);
    if (!(canDelete.some(can => can === true))) {
      throw new ForbiddenError(`You're not allowed to delete these posts`);
    }
    posts = posts
      .map((post, i) => {
        post.canDelete = canDelete[i];
        return post;
      })
      .filter(post => post.canDelete === true);

    let headPosts = posts.filter(post => this.PostService.isThreadHead(post));
    if (headPosts?.length) {
      await Tools.parallel(async post => {
        try {
          let thread = await this.ThreadService.readOneById(post.threadId);
          delete thread.head;
          delete thread.posts;
          let threadPosts = await this.PostService.readThreadPosts(post.threadId);
          if (threadPosts?.length > 1) { // if thread has answers
            posts = posts.concat(threadPosts.slice(1));
          }
          await this.ThreadService.deleteOne(thread);
          EventBus.emit('broadcast', 'thread', 'deleted', thread);
        } catch (e) {
          //
        }
      }, headPosts);
    }

    let deletedCount = await this.PostService.deleteMany(posts);
    await Tools.parallel(this.deleteAttachments.bind(this), posts);

    posts = await Tools.parallel(this.cleanOutput.bind(this), posts);
    if (!headPosts?.length) {
      for (let post of posts) {
        EventBus.emit('broadcast', 'post', 'deleted', post);
      }
    }
    return deletedCount;
  }

  async deleteAttachments(post) {
    if (!post.attachments?.length) {
      return false;
    }
    for await (const { hash } of post.attachments) {
      let postsWithThisFile = await this.PostService.readByAttachmentHash(hash);
      if (postsWithThisFile < 2) { // is unique (1) or absent (0)
        await this.FileService.delete(hash);
        return true;
      }
    }
  }

  async process(post) {
    if (!post) {
      return;
    }

    if (post.attachments?.length > 0) {
      const attachments = await this.FileService.read(post.attachments);
      post.attachments = post.attachments.map(hash => attachments.find(a => hash === a.hash));
    }

    return post;
  }

  async can(permission, post, session) {
    if (!post || !session) {
      return false;
    }

    // Without user session
    let isLoggedIn = !!session.user?.id;
    let sameSession = session && (session.key === post.sessionKey);
    if (!isLoggedIn) {
      return sameSession;
    }

    // With user session
    let sameUser = post.userId > 0 && (session.user?.id === post.userId);
    if (sameSession || sameUser) { // NOTE: This condition has no DB queries
      return sameSession || sameUser;
    }

    // Admin permissions
    let Member = await this.MemberService.readOneByUserId(session.user?.id);
    let Board = await this.BoardService.readByPostId(post.id);
    return await this.AccessService.hasPermissionForBoard(Member?.groupName, Board.name, permission);
  }

  async canDelete(post, session) {
    return await this.can('moderate', post, session);
  }

  cleanOutput(post, hasPrivileges) {
    if (Array.isArray(post)) {
      return post.map(p => this.cleanOutput(p, hasPrivileges));
    }
    return post.toObject(hasPrivileges);
  }

}

module.exports = PostBO;
