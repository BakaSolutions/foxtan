const DAO = require('./super.js');

class ThreadDAO extends DAO {

  constructor(connection, schema) {
    super(connection, schema + '.');
  }

  create(thread) {
    throw new Error();
  }

  async readOneById(id) {
    const template = `SELECT * FROM ${this._schema}thread WHERE thread.id = $1 LIMIT 1`;
    const values = [ id ];
    const query = await this._executeQuery(template, values);
    return query[0];
  }

  async readOneByHeadId(headId) {
    const template = `SELECT * FROM ${this._schema}thread WHERE thread."headId" = $1 LIMIT 1`;
    const values = [ headId ];
    const query = await this._executeQuery(template, values);
    return query[0];
  }

  async readOneByBoardAndPost(boardName, postNumber) {
    const template = `SELECT thread.*
FROM foxtan.board, foxtan.thread, foxtan.post
WHERE thread."boardName" = board.name
AND thread.id = post."threadId"
AND board.name = $1
AND post.number = $2
LIMIT 1`;
    const values = [ boardName, postNumber ];
    const query = await this._executeQuery(template, values);
    return query[0];
  }

  readAllByBoard(boardName, { count, page } = {}) {
    let template = `SELECT * FROM ${this._schema}thread WHERE thread."boardName" = $1`;
    let values = [ boardName ];
    let query = this._limitOffset(template, values, { count, page });
    return this._executeQuery(...query);
  }

  update(thread) {
    throw new Error();
  }

  delete(thread) {
    throw new Error();
  }

}

module.exports = ThreadDAO;