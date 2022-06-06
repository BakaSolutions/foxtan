class UserModelInterface {

  async create({ name, email, invite, password }) {}
  async readOneByNameOrEmail({name, email}) {}
  async readOneByName(name) {}
  async readOneByEmail(email) {}

}

module.exports = UserModelInterface;
