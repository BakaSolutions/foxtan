class FileModelInterface {

  async create(fileDTO) {}
  async read(hashArray) {}
  async delete(hash) {}

}

module.exports = FileModelInterface;
