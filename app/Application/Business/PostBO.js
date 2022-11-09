const Tools = require('../../Infrastructure/Tools.js');
const EventBus = require('../../Infrastructure/EventBus.js');

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
    let posts = await Promise.all(ids.map(async id => await this.readOne(id)));
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

  async deleteOne({ postId, postNumber }, user) {
    let post = postId > 0
      ? await this.readOne(postId)
      : await this.readOneByBoardAndPost(...Object.entries(postNumber));

    // TODO: Check user session
    // TODO: Check if post is a thread => delete thread posts
    return this.PostService.deleteOne(post);
  }

  async deleteMany({ postIds, postNumbers }, user) {
    let posts = postIds?.length > 0
      ? await this.readMany(postIds)
      : new Error('Not implemented yet, sorry');

    if (posts instanceof Error) {
      throw posts; // TODO: Read posts by boardNames and postNumbers
    }

    // TODO: Check user session
    // TODO: Check if some of posts are threads => delete threads posts
    return this.PostService.deleteMany(posts);
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

  cleanOutput(post, hasPrivileges) {
    if (Array.isArray(post)) {
      return post.map(p => this.cleanOutput(p, hasPrivileges));
    }
    return post.toObject(hasPrivileges);
  }

}

module.exports = PostBO;
