class UserModelInterface {

  async create({ name, email, invite, password }) {}
  async readOneById(id) {}
  async readOneByName(name) {}
  async readOneByEmail(email) {}

}

module.exports = UserModelInterface;
