class ReplyService {

  /**
   *
   * @param {ReplyModelInterface} ReplyModel
   */
  constructor(ReplyModel) {
    if (!ReplyModel) {
      throw new Error('No ReplyModel');
    }
    this._model = ReplyModel;
  }

  async create(fromId, toId) {
    let privilege = await this._model.create({fromId, toId});
    return privilege.toObject();
  }

  /**
   * Returns Reply[] where Post with `id` refer to any posts
   * @param id
   * @returns {Promise<*|*[]>}
   */
  async readPostReferences(id) {
    return await this._model.readPostReferences(id) || [];
  }

  /**
   * Returns Reply[] where Post with `id` has replies
   * @param id
   * @returns {Promise<*|*[]>}
   */
  async readPostReplies(id) {
    return await this._model.readPostReplies(id) || [];
  }

}

module.exports = ReplyService;
