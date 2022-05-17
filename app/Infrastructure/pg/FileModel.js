const FileModelInterface = require('../../Adapter/Interface/FileModelInterface.js');
const Dialect = require('./Dialect.js');
const FileDTO = require('../../Domain/DTO/FileDTO.js');

class FileModelPostgre extends FileModelInterface {

  constructor(connection) {
    super();
    this.dialect = new Dialect(connection);
  }

  async create(file) {
    const columns = ['hash', 'mime', 'name', 'size', 'width', 'height', 'modifiers'];
    const template = `
      INSERT INTO file
      (${columns.map(c => '"' + c + '"').join(', ')})
      VALUES (${columns.map((c, i) => '$' + (i + 1))})
      RETURNING *
    `;
    const values = columns.map(attr => file[attr]);
    const query = await this.dialect.executeQuery(template, values);
    return FileDTO.from(query[0]);
  }

  async read(hashArray) {
    const template = `
      SELECT *
      FROM file
      WHERE hash = ANY ($1)
    `;
    const query = await this.dialect.executeQuery(template, [hashArray]);
    return query.map(file => FileDTO.from(file));
  }

}

module.exports = FileModelPostgre;
