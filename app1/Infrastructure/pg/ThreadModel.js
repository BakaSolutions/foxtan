const ThreadModelInterface = require('../../Domain/ThreadModelInterface.js');
const Dialect = require('./Dialect.js');
const ThreadDTO = require('../ThreadDTO.js');

class ThreadModelPostgre extends ThreadModelInterface {

  constructor(connection) {
    super();
    this.dialect = new Dialect(connection);
  }

  async create(thread) {
    const template = `INSERT INTO foxtan.thread 
  ("boardName", "limitsId", "pinned", "modifiers") 
  VALUES ($1, $2, $3, $4)
  RETURNING *`;
    const values = thread.toArray();
    const query = await this.dialect.executeQuery(template, values);
    return ThreadDTO.from(query[0]);
  }

  async readOneById(id) {
    const template = `SELECT * FROM foxtan.thread WHERE id = $1 LIMIT 1`;
    const values = [ id ];
    const query = await this.dialect.executeQuery(template, values);
    return ThreadDTO.from(query[0]);
  }

  async readMany({ count, page, order } = {}) {
    throw new Error();
  }

  async readAllByBoard(boardName, { count, page } = {}) {
    let template = `SELECT t.*
FROM foxtan.thread t, foxtan.post p
WHERE p."threadId" = t.id
AND t."boardName" = $1
AND p.id IN
(SELECT DISTINCT ON ("threadId") id FROM foxtan.post
WHERE NOT ('sage' = ANY(COALESCE(modifiers, array[]::varchar[]))))
GROUP BY t.id, p.id
ORDER BY MAX(p.id) DESC`;
    let values = [ boardName ];
    let query = Dialect.limitOffset(template, values, { count, page });
    return this.dialect.executeQuery(...query);
  }

  async update(thread) {
    throw new Error();
  }

  async deleteOne(thread) {
    throw new Error();
  }

  async deleteMany(thread) {
    throw new Error();
  }

}

module.exports = ThreadModelPostgre;
