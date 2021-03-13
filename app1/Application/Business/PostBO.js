class PostBO {

  constructor(PostService) {
    this.PostService = PostService;
  }

  async create(postDTO) {
    return this.PostService.create(postDTO);
  }

  async readOne(id) {
    return this.PostService.readOneById(id);
  }

  async readMany({ boardName, threadId, count, page } = {}) {
    return this.PostService.readMany({ boardName, threadId, count, page });
  }

  /*
  async deleteOne(post) {
    return this.PostService.deleteOne(post);
  }

  async deleteMany(posts) {
    return this.PostService.deleteMany(posts);
  }
  */

}

module.exports = PostBO;
