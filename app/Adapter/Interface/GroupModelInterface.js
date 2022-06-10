class GroupModelInterface {

  async create({ name, privilegesId, description }) {}
  async readOneByName(name) {}

}

module.exports = GroupModelInterface;
