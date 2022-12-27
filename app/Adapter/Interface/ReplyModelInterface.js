class ReplyModelInterface {

  async create({ fromId, toId } = {}) {}
  async readPostReferences(id) {}
  async readPostReplies(id) {}
  async deleteRepliesByPostId(postId) {}

}

module.exports = ReplyModelInterface;
