const ThreadModelInterface = require('../../Adapter/Interface/ThreadModelInterface.js');
const Dialect = require('./Dialect.js');
const ThreadDTO = require('../../Domain/DTO/ThreadDTO.js');

class ThreadModelPostgre extends ThreadModelInterface {

  constructor(connection) {
    super();
    this.dialect = new Dialect(connection);
  }

  async create(thread) {
    const template = `INSERT INTO thread
  ("boardName", "limitsId", "pinned", "modifiers")
  VALUES ($1, $2, $3, $4)
  RETURNING *`;
    const values = thread.toArray();
    const query = await this.dialect.executeQuery(template, values);
    return ThreadDTO.from(query[0]);
  }

  async readOneById(id) {
    const template = `SELECT * FROM thread WHERE id = $1 LIMIT 1`;
    const values = [ id ];
    const query = await this.dialect.executeQuery(template, values);
    return ThreadDTO.from(query[0]);
  }

  async readOneByHeadId(headId) {
    const template = `SELECT *
FROM thread
WHERE id in (
  SELECT "threadId"
  FROM post
  WHERE id = $1
)
LIMIT 1`;
    const values = [ headId ];
    const query = await this.dialect.executeQuery(template, values);
    return ThreadDTO.from(query[0]);
  }

  async readMany({ count, page, order } = {}) {
    throw new Error();
  }

  async readAllByBoard(boardName, { count, page } = {}) {
    let template = `SELECT t.*
FROM thread t
INNER JOIN post p ON p."threadId" = t.id
WHERE t."boardName" = $1
AND p.id IN (
  SELECT DISTINCT ON ("threadId") id
  FROM post
  WHERE NOT ('sage' = ANY(COALESCE(modifiers, array[]::varchar[])))
)
GROUP BY t.id, p.id
ORDER BY t.pinned DESC NULLS LAST, MAX(p.id) DESC`;
    let values = [ boardName ];
    let query = Dialect.limitOffset(template, values, { count, page });
    let threads = await this.dialect.executeQuery(...query);
    return threads.map(thread => ThreadDTO.from(thread));
  }

  async readOneByBoardAndPost(boardName, postNumber) {
    const template = `SELECT t.*
FROM thread t
INNER JOIN post p ON t.id = p."threadId"
WHERE t."boardName" = $1
AND p.number = $2
LIMIT 1`;
    const values = [ boardName, postNumber ];
    const query = await this.dialect.executeQuery(template, values);
    return ThreadDTO.from(query[0]);
  }

  async pin({ id, priority } = {}) {
    const template = `UPDATE "thread"
SET "pinned" = $1
WHERE "id" = $2`;
    const values = [ priority, id ];
    let query = await this.dialect.executeQuery(template, values, {raw: true});
    return query.rowCount;
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
