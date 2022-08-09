class InviteService {

  /**
   *
   * @param {InviteModelInterface} InviteModel
   */
  constructor(InviteModel) {
    if (!InviteModel) {
      throw new Error('No InviteModel');
    }
    this._model = InviteModel;
  }

  async create(inviteObject) {
    let invite = await this._model.create(inviteObject);
    return invite.toObject();
  }


  async readOneById(id) {
    return this._model.readOneById(id);
  }

  async readOneByCode(code) {
    return this._model.readOneByCode(code);
  }

  async readOneByAuthorId(userId) {
    return this._model.readOneByAuthorId(userId);
  }

  async redeem({ code } = {}, date = +new Date()) {
    return this._model.setExpired({ code }, date);
  }

}

module.exports = InviteService;
