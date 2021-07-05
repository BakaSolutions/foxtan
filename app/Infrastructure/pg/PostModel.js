const PostModelInterface = require('../../Adapter/Interface/PostModelInterface.js');
const Dialect = require('./Dialect.js');
const PostDTO = require('../../Domain/DTO/PostDTO.js');

class PostModelPostgre extends PostModelInterface {

  constructor(connection) {
    super();
    this.dialect = new Dialect(connection);
  }

  async create(post) {
    const template = `INSERT INTO foxtan.post
("threadId", "userId", "number", "subject", "text", "sessionKey",
"modifiers", "ipAddress", "created", "updated", "deleled")
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *`;
    const values = post.toArray();
    const query = await this.dialect.executeQuery(template, values);
    return PostDTO.from(query[0]);
  }

  async readOneById(id) {
    const template = `SELECT * FROM foxtan.post WHERE id = $1 LIMIT 1`;
    const values = [ id ];
    const query = await this.dialect.executeQuery(template, values);
    return PostDTO.from(query[0]);
  }

  async readOneByThreadId(threadId) {
    const template = `SELECT * FROM foxtan.post WHERE "threadId" = $1 ORDER BY id LIMIT 1`;
    const values = [ threadId ];
    const query = await this.dialect.executeQuery(template, values);
    return PostDTO.from(query[0]);
  }

  async readOneByBoardAndPost(boardName, number) {
    const template = `SELECT p.*
FROM foxtan.post p
INNER JOIN foxtan.thread t ON p."threadId" = t.id
WHERE t."boardName" = $1
AND p.number = $2
LIMIT 1`;
    const values = [ boardName, number ];
    const query = await this.dialect.executeQuery(template, values);
    return PostDTO.from(query[0]);
  }

  async readByThreadId(threadId, { count, page, order } = {}) {
    const template = `SELECT * FROM foxtan.post WHERE "threadId" = $1`;
    const values = [ threadId ];
    let query = Dialect.orderBy(template, values, { orderBy: "id", order });
    query = Dialect.limitOffset(...query, { count, page });
    let posts = await this.dialect.executeQuery(...query);
    return posts.map(post => PostDTO.from(post));
  }

  async readByBoardNameAndThreadNumber(boardName, threadNumber, { count, page, order } = {}) {
    const template = `SELECT *
FROM foxtan.post
WHERE "threadId" = (
  SELECT p."threadId"
  FROM foxtan.post p
  INNER JOIN foxtan.thread t ON p."threadId" = t.id
  WHERE t."boardName" = $1 AND p.number = $2
  LIMIT 1
)`;
    const values = [ boardName, threadNumber ];
    let query = Dialect.orderBy(template, values, { orderBy: "id", order });
    query = Dialect.limitOffset(...query, { count, page });
    let posts = await this.dialect.executeQuery(...query);
    return posts.map(post => PostDTO.from(post));
  }

  async readByBoardName(boardName, { count, page, order } = {}) {
    let template = `SELECT p.*
FROM foxtan.post p
INNER JOIN foxtan.thread t ON p."threadId" = t.id
WHERE t."boardName" = $1`;
    let values = [ boardName ];
    let query = Dialect.orderBy(template, values, { orderBy: "p.id", order });
    query = Dialect.limitOffset(...query, { count, page });
    let posts = await this.dialect.executeQuery(...query);
    return posts.map(post => PostDTO.from(post));
  }

  async countByThreadId(threadId) {
    const template = `SELECT COUNT(id) FROM foxtan.post WHERE "threadId" = $1`;
    const values = [ threadId ];
    const query = await this.dialect.executeQuery(template, values);
    return +query[0].count;
  }

  async update(post) {
    throw new Error();
  }

  async deleteOne(post) {
    throw new Error();
  }

  async deleteMany(post) {
    throw new Error();
  }

}

module.exports = PostModelPostgre;
