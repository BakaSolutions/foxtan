const DAO = require('./super.js');
const Post = require('../../object/Post.js');

class PostDAO extends DAO {

  constructor(connection, schema) {
    super(connection, schema + '.');
  }

  async create(post) {
    if (!(post instanceof Post)) {
      throw new Error('Post must be created via PostObject');
    }
    const template = `INSERT INTO ${this._schema}post 
("threadId", "userId", "number", "subject", "text", "sessionKey", 
"modifiers", "ipAddress", "created", "updated", "deleled") 
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *`;
    const values = post.toArray();
    const query = await this._executeQuery(template, values);
    return query[0];
  }

  async readOneById(id) {
    const template = `SELECT * FROM ${this._schema}post WHERE id = $1 ORDER BY id LIMIT 1`;
    const values = [ id ];
    const query = await this._executeQuery(template, values);
    return query[0];
  }

  async readOneByThreadId(threadId) {
    const template = `SELECT * FROM ${this._schema}post WHERE "threadId" = $1 ORDER BY id LIMIT 1`;
    const values = [ threadId ];
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
    const template = `SELECT COUNT(id) FROM ${this._schema}post p WHERE p."threadId" = $1`;
    const values = [ threadId ];
    const query = await this._executeQuery(template, values);
    return +query[0].count;
  }

  async readLastNumberByBoardName(boardName) {
    const template = `SELECT MAX(p.number)
FROM ${this._schema}post p, ${this._schema}thread t, ${this._schema}board b
WHERE p."threadId" = t.id AND t."boardName" = b.name AND b.name = $1`;
    const values = [ boardName ];
    const query = await this._executeQuery(template, values);
    return +query[0].max;
  }

  update(post) {
    throw new Error();
  }

  delete(post) {
    throw new Error();
  }

}

module.exports = PostDAO;