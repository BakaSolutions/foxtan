class MemberService {

  /**
   *
   * @param {MemberModelInterface} MemberModel
   */
  constructor(MemberModel) {
    if (!MemberModel) {
      throw new Error('No MemberModel');
    }
    this._model = MemberModel;
  }

  async create(memberObject) {
    memberObject.invitedAt = new Date();

    let member = await this._model.create(memberObject);
    return member.toObject();
  }

  async readOneByUserId(userId) {
    let member = await this._model.readOneByUserId(userId);
    return member ? member.toObject() : member;
  }

}

module.exports = MemberService;
