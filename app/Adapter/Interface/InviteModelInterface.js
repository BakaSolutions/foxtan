class InviteModelInterface {

  async create() {}
  async readOneById(id) {}
  async readOneByAuthorId(authorId) {}
  async readOneByCode(code) {}
  async setExpired({ code }, date) {}

}

module.exports = InviteModelInterface;
