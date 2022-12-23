class ReplyModelInterface {

  async create({ fromId, toId } = {}) {}
  async readPostReferences(id) {}
  async readPostReplies(id) {}

}

module.exports = ReplyModelInterface;
