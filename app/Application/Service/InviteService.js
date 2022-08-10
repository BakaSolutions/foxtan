const {
  BadRequestError,
  NotFoundError
} = require('../../Domain/Error/index.js');

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
    let invite = await this._model.readOneById(id);
    if (!invite) {
      throw new NotFoundError('There is no such an invite');
    }
    return invite;
  }

  async readOneByCode(code) {
    let invite = await this._model.readOneByCode(code);
    if (!invite) {
      throw new BadRequestError('There is no such an invite');
      // It'll be 400 during register, in other ways - 404
    }
    return invite;
  }

  async readOneByAuthorId(userId) {
    let invite = await this._model.readOneByAuthorId(userId);
    if (!invite) {
      throw new NotFoundError('There is no such an invite');
    }
    return invite;
  }

  async redeem({ code } = {}, date = new Date()) {
    return this._model.setExpired({ code }, date);
  }

}

module.exports = InviteService;
