const DAO = require('./super.js');
const AppObject = require('../../core/AppObject.js');

class AttachmentDAO extends DAO {

  constructor(connection, schema) {
    super(connection, schema + '.');
  }

  async create(file) {
    if (!(file instanceof AppObject)) {
      throw new Error('Attachment must be created via AttachmentObject');
    }
    const template = `INSERT INTO ${this._schema}attachment
("postId", "fileHash")
VALUES ($1, $2)
RETURNING *`;
    const values = file.toArray();
    const query = await this._executeQuery(template, values);
    return query[0];
  }

  //TODO: createMany()

  async readByPostId(postId) {
    const template = `SELECT * FROM ${this._schema}attachment
WHERE "postId" = $1`;
    const values = [ postId ];
    return this._executeQuery(template, values);
  }

  async readByFileHash(fileHash) {
    const template = `SELECT * FROM ${this._schema}attachment
WHERE "fileHash" = $1`;
    const values = [ fileHash ];
    // TODO; Implement limit/offset and order by `attachmentId`
    return this._executeQuery(template, values);
  }

  delete() {
    throw new Error();
  }

}

module.exports = AttachmentDAO;