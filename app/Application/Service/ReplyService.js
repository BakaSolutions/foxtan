const { BadRequestError } = require("../../Domain/Error");

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
   * Returns Reply[] where Post with `id` has replies
   * @param id
   * @returns {Promise<*|*[]>}
   */
  async readPostReplies(id) {
    return await this._model.readPostReplies(id) || [];
  }

  async deleteRepliesByPostId(id) {
    if (!id) {
      throw new BadRequestError('Provide id to delete the reply');
    }
    return await this._model.deleteRepliesByPostId(id);
  }

}

module.exports = ReplyService;
