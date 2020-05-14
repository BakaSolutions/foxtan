const DAO = require('./super.js');

class PostDAO extends DAO {

  constructor(connection, schema) {
    super(connection, schema + '.');
  }

  create(post) {
    throw new Error();
  }

  async readOneById(id) {
    const template = `SELECT * FROM ${this._schema}post WHERE post.id = $1 LIMIT 1`;
    const values = [ id ];
    const query = await this._executeQuery(template, values);
    return query[0];
  }

  async readOneByBoardAndPost(boardName, postNumber) {
    const template = `SELECT p.*
FROM ${this._schema}post p, ${this._schema}thread t
WHERE p."threadId" = t.id
AND t."boardName" = $1
AND p.number = $2
LIMIT 1`;
    const values = [ boardName, postNumber ];
    const query = await this._executeQuery(template, values);
    return query[0];
  }

  readAllByBoardName(boardName, { count, page, order } = {}) {
    let template = `SELECT p.*
FROM ${this._schema}post p, ${this._schema}thread t
WHERE p."threadId" = t.id
AND t."boardName" = $1`;
    let values = [ boardName ];
    let query = this._orderBy(template, values, { orderBy: "p.id", order });
    query = this._limitOffset(...query, { count, page });
    return this._executeQuery(...query);
  }

  readAllByThreadId(threadId, { count, page, order } = {}) {
    const template = `SELECT p.*
FROM ${this._schema}post p, ${this._schema}thread t
WHERE p."threadId" = t.id
AND p."threadId" = $1`;
    const values = [ threadId ];
    let query = this._orderBy(template, values, { orderBy: "p.id", order });
    query = this._limitOffset(...query, { count, page });
    return this._executeQuery(...query);
  }

  async countByThreadId(threadId) {
    const template = `SELECT COUNT(id) FROM ${this._schema}post WHERE post."threadId" = $1`;
    const values = [ threadId ];
    const query = await this._executeQuery(template, values);
    return +query[0].count;
  }

  update(post) {
    throw new Error();
  }

  delete(post) {
    throw new Error();
  }

}

module.exports = PostDAO;