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

  async readByPostIds(postIds) {
    let template = `SELECT * FROM ${this._schema}attachment
WHERE "postId"`;
    let query = this._in(template, postIds);
    return this._executeQuery(...query);
  }

  async readByFileHashes(fileHashes) {
    let template = `SELECT * FROM ${this._schema}attachment
WHERE "fileHash"`;
    let query = this._in(template, fileHashes);
    return this._executeQuery(...query);
  }

  async readOneByPostIdAndFileHash(postId, fileHash) {
    const template = `SELECT * FROM ${this._schema}attachment
WHERE "postId" = $1 AND "fileHash" = $2 LIMIT 1`;
    const values = [ postId, fileHash ];
    return this._executeQuery(template, values);
  }

  async deleteByPostIdAndFileHash(postId, fileHash) {
    const template = `DELETE FROM ${this._schema}attachment
WHERE "postId" = $1 AND "fileHash" = $2 LIMIT 1`;
    const values = [ postId, fileHash ];
    return this._executeQuery(template, values);
  }

}

module.exports = AttachmentDAO;