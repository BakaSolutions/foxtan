const {
  BadRequestError,
  NotFoundError
} = require('../../Domain/Error/index.js');
const Tools = require('../../Infrastructure/Tools.js');

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

  /**
   * @param {Object} inviteObject
   * @param {Number} inviteObject.authorId
   * @param {String} inviteObject.groupName
   * @param {String} [inviteObject.code]
   * @param {Date} [inviteObject.createdAt]
   * @param {Date} [inviteObject.expiredAt]
   */
  async create(inviteObject) {
    inviteObject.code ??= Tools.randomHex(20);
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
    code = code?.toLocaleLowerCase();
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
