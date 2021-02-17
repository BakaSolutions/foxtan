const PostModelInterface = require('../../app1/Domain/PostModelInterface.js');
const PostDTO = require('../../app1/Infrastructure/PostDTO.js');

class PostModelMock extends PostModelInterface {

  constructor() {
    super();
    this.flush();
  }

  async create(post) {
    post.id = this.storage.length + 1;
    this.storage.push(post);
    return {
      id: post.id
    };
  }

  async readOneById(id) {
    let post = this.storage.filter(post => post.id);
    return Array.isArray(post)
      ? PostDTO.from(post[0])
      : PostDTO.from(post);
  }

  flush() {
    this.storage = [];
  }

}

module.exports = PostModelMock;
