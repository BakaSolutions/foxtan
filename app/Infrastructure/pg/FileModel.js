const FileModelInterface = require('../../Adapter/Interface/FileModelInterface.js');
const Dialect = require('./Dialect.js');
const FileDTO = require('../../Domain/DTO/FileDTO.js');

class FileModelPostgre extends FileModelInterface {

  constructor(connection) {
    super();
    this.dialect = new Dialect(connection);
  }

  async create(file) {
    const template = `INSERT INTO file
("hash", "mime", "name", "size", "width", "height")
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *`;
    const values = ['hash', 'mime', 'name', 'size', 'width', 'height']
      .map(attr => file[attr]);
    const query = await this.dialect.executeQuery(template, values);
    return FileDTO.from(query[0]);
  }

  async read(hashArray) {
    const template = `
SELECT f.*
FROM UNNEST(ARRAY[$1]) file_hash
LEFT JOIN file f on f.hash=file_hash
    `;
    const query = await this.dialect.executeQuery(template, hashArray);
    return query.map(file => FileDTO.from(file));
  }

}

module.exports = FileModelPostgre;
