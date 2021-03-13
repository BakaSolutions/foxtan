const DAO = require('./super.js');
//const File = require('../../object/File.js');
const AppObject = require('../../core/AppObject.js');

class FileDAO extends DAO {

  constructor(connection, schema) {
    super(connection, schema + '.');
  }

  async create(file) {
    if (!(file instanceof AppObject)) {
      throw new Error('File must be created via FileObject');
    }
    const template = `INSERT INTO ${this._schema}file
("hash", "mime", "title", "width", "height", "thumbWidth", "thumbHeight", "modifiers")
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *`;
    const values = file.toArray();
    const query = await this._executeQuery(template, values);
    return query[0];
  }

  //TODO: createMany()

  async readOneByHash(hash) {
    const template = `SELECT * FROM ${this._schema}file WHERE hash = $1 LIMIT 1`;
    const values = [ hash ];
    const query = await this._executeQuery(template, values);
    return query[0];
  }

  async readByHashes(hashes) {
    let template = `SELECT * FROM ${this._schema}file WHERE hash`;
    let query = this._in(template, hashes);
    query = await this._executeQuery(...query);
    return query || [];
  }

  update() {
    throw new Error();
  }

  delete() {
    throw new Error();
  }

}

module.exports = FileDAO;