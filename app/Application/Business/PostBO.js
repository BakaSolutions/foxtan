const Tools = require('../../Infrastructure/Tools.js');
const EventBus = require('../../Infrastructure/EventBus.js');
const { ForbiddenError } = require('../../Domain/Error/index.js');

class PostBO {

  /**
   *
   * @param {PostService} PostService
   * @param {ThreadService} ThreadService
   * @param {BoardService} BoardService
   * @param {FileService} FileService
   * @param {AccessService} AccessService
   * @param {MemberService} MemberService
   */
  constructor({PostService, ThreadService, BoardService, FileService, AccessService, MemberService} = {}) {
    if (!PostService) {
      throw new Error('No PostService');
    }
    if (!ThreadService) {
      throw new Error('No ThreadService');
    }
    if (!BoardService) {
      throw new Error('No BoardService');
    }
    if (!FileService) {
      throw new Error('No FileService');
    }
    if (!AccessService) {
      throw new Error('No AccessService');
    }
    if (!MemberService) {
      throw new Error('No MemberService');
    }
    this.PostService = PostService;
    this.ThreadService = ThreadService;
    this.BoardService = BoardService;
    this.FileService = FileService;
    this.AccessService = AccessService;
    this.MemberService = MemberService;
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
    [postDTO, threadDTO] = await this.createPreHook(postDTO, threadDTO);
    let Post = await this.PostService.create(postDTO);
    return this.createPostHook(Post, threadDTO);
  }

  async createPostHook(Post, threadDTO) {
    Post = await this.process(Post);

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
    boards.map(async boardName => {
      let portionOfPosts = await this.PostService.readMany(boardName, postObject[boardName]);
      posts = posts.concat(portionOfPosts);
    });
    return Tools.parallel(this.process.bind(this), posts);
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

  async deleteOne({ postId, postNumber }, session) {
    let post = postId > 0
      ? await this.readOne(postId)
      : await this.readOneByBoardAndPost(...Object.entries(postNumber));

    if (!(await this.canDelete(post, session))) {
      throw new ForbiddenError(`You're not allowed to delete this post`);
    }

    let isThread = await this.PostService.isThreadHead(post);
    if (isThread) {
      let threadPosts = await this.PostService.readOneByThreadId(post.threadId);
      let postsForDeletion = [post, ...threadPosts];
      await this.deleteAttachments(postsForDeletion);
      return this.PostService.deleteMany(postsForDeletion);
    }

    await this.deleteAttachments(post);
    return this.PostService.deleteOne(post);
  }

  async deleteMany({ postIds, postNumbers }, session) {
    let posts = postIds?.length > 0
      ? await this.readMany(postIds)
      : await this.readManyByBoardAndPost(postNumbers);

    let canDelete = (await Tools.parallel(this.canDelete, posts, session)).filter(Boolean);

    if (!canDelete.length) {
      throw new ForbiddenError(`You're not allowed to delete these posts`);
    }

    let headPosts = posts.filter(post => this.PostService.isThreadHead(post));
    if (headPosts?.length) {
      await Tools.parallel(async post => {
        try {
          let thread = await this.ThreadService.readOneById(post.threadId);
          let threadPosts = await this.PostService.readThreadPosts(post.threadId);
          if (threadPosts?.length > 1) { // if thread has answers
            posts = posts.concat(threadPosts.slice(1));
          }
          await this.ThreadService.deleteOne(thread);
        } catch (e) {
          //
        }
      }, headPosts);
    }

    posts.map(async post => await this.deleteAttachments(post));
    return this.PostService.deleteMany(posts);
  }

  async deleteAttachments(post) {
    if (post.attachments?.length > 0) {
      for await (const { hash } of post.attachments) {
        let postsWithThisFile = await this.PostService.readByAttachmentHash(hash);
        if (postsWithThisFile < 2) { // is unique (1) or absent (0)
          await this.FileService.delete(hash);
        }
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

  async canDelete(post, session) {
    let isLoggedIn = !!session.user?.id;
    if (!isLoggedIn) {
      return session.key === post.sessionKey;
    }

    let Member = await this.MemberService.readOneByUserId(session.user?.id);
    let Board = await this.BoardService.readByPostId(post.id);
    let hasPower = await this.AccessService.hasPermissionForBoard(Member?.groupName, Board.name, 'moderate');
    return hasPower
      || (session.key === post.sessionKey)
      || (post.userId > 0 && (session.user?.id === post.userId));
  }

  cleanOutput(post, hasPrivileges) {
    if (Array.isArray(post)) {
      return post.map(p => this.cleanOutput(p, hasPrivileges));
    }
    return post.toObject(hasPrivileges);
  }

}

module.exports = PostBO;
