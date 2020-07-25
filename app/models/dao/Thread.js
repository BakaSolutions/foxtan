const DAO = require('./super.js');
const Thread = require('../../object/Thread.js');

const PostDAO = require('./Post.js');

class ThreadDAO extends DAO {

  constructor(connection, schema) {
    super(connection, schema + '.');
    this.post = new PostDAO(connection, schema);
  }

  async create(thread) {
    if (!(thread instanceof Thread)) {
      throw new Error('Thread must be created via ThreadObject');
    }
    const template = `INSERT INTO ${this._schema}thread
("boardName", "pinned", "modifiers")
VALUES ($1, $2, $3)
RETURNING *`;
    const values = thread.toArray();
    const query = await this._executeQuery(template, values);
    return query[0];
  }

  async createOp(thread, post) { // TODO: Remove transactions from logic
    try {
      await this._executeQuery('BEGIN');
      await this.create(thread);
      await this.post.create(post);
      await this._executeQuery('COMMIT');
    } catch (e) {
      await this._executeQuery('ROLLBACK');
      throw e;
    }
  }

  async readOneById(id) {
    const template = `SELECT * FROM ${this._schema}thread WHERE id = $1 LIMIT 1`;
    const values = [ id ];
    const query = await this._executeQuery(template, values);
    return query[0];
  }

  async readOneByHeadId(headId) {
    const template = `SELECT * FROM ${this._schema}thread t where t.id in (select "threadId" from ${this._schema}post WHERE id = $1) LIMIT 1`;
    const values = [ headId ];
    const query = await this._executeQuery(template, values);
    return query[0];
  }

  async readOneByBoardAndPost(boardName, postNumber) {
    const template = `SELECT t.*
FROM ${this._schema}board b, ${this._schema}thread t, ${this._schema}post p
WHERE t."boardName" = b.name
AND t.id = p."threadId"
AND b.name = $1
AND p.number = $2
LIMIT 1`;
    const values = [ boardName, postNumber ];
    const query = await this._executeQuery(template, values);
    return query[0];
  }

  readAllByBoard(boardName, { count, page } = {}) {
    let template = `SELECT t.*
FROM ${this._schema}thread t, ${this._schema}post p
WHERE p."threadId" = t.id
AND t."boardName" = $1
AND p.id IN
(SELECT DISTINCT ON ("threadId") id FROM ${this._schema}post WHERE NOT ('sage' = ANY(COALESCE(modifiers, array[]::varchar[]))))
GROUP BY t.id, p.id
ORDER BY MAX(p.id) DESC`;
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