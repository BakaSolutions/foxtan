const PostModelInterface = require('../../Adapter/Interface/PostModelInterface.js');
const Dialect = require('./Dialect.js');
const PostDTO = require('../../Domain/DTO/PostDTO.js');

class PostModelPostgre extends PostModelInterface {

  constructor(connection) {
    super();
    this.dialect = new Dialect(connection);
  }

  async create(post) {
    const columns = [
      'threadId', 'userId', 'number', 'subject', 'text',
      'sessionKey', 'modifiers', 'ipAddress', 'created', 'updated',
      'deleled', 'attachments', 'isHead',
    ];

    const template = `
      INSERT INTO post
      (${columns.map(c => '"' + c + '"').join(', ')})
      VALUES (${columns.map((c, i) => '$' + (i + 1))})
      RETURNING *`;

    const values = columns.map(attr => post[attr]);
    const query = await this.dialect.executeQuery(template, values);
    return PostDTO.from(query[0]);
  }

  async readOneById(id) {
    const template = `SELECT * FROM post WHERE id = $1 LIMIT 1`;
    const values = [ id ];
    const query = await this.dialect.executeQuery(template, values);
    return PostDTO.from(query[0]);
  }

  async readOneByThreadId(threadId) {
    const template = `
      SELECT *
      FROM post
      WHERE "threadId" = $1 AND "isHead" IS TRUE
      LIMIT 1`;

    const values = [ threadId ];
    const query = await this.dialect.executeQuery(template, values);
    return PostDTO.from(query[0]);
  }

  async readOneByBoardAndPost(boardName, number) {
    const template = `SELECT p.*
FROM post p
INNER JOIN thread t ON p."threadId" = t.id
WHERE t."boardName" = $1
AND p.number = $2
LIMIT 1`;
    const values = [ boardName, number ];
    const query = await this.dialect.executeQuery(template, values);
    return PostDTO.from(query[0]);
  }

  async readByThreadId(threadId, { count, page, order } = {}) {
    const template = `SELECT * FROM post WHERE "threadId" = $1`;
    const values = [ threadId ];
    let query = Dialect.orderBy(template, values, { orderBy: "id", order });
    query = Dialect.limitOffset(...query, { count, page });
    let posts = await this.dialect.executeQuery(...query);
    return posts.map(post => PostDTO.from(post));
  }

  async readByBoardNameAndThreadNumber(boardName, threadNumber, { count, page, order } = {}) {
    const template = `SELECT *
FROM post
WHERE "threadId" = (
  SELECT p."threadId"
  FROM post p
  INNER JOIN thread t ON p."threadId" = t.id
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
FROM post p
INNER JOIN thread t ON p."threadId" = t.id
WHERE t."boardName" = $1`;
    let values = [ boardName ];
    let query = Dialect.orderBy(template, values, { orderBy: "p.id", order });
    query = Dialect.limitOffset(...query, { count, page });
    let posts = await this.dialect.executeQuery(...query);
    return posts.map(post => PostDTO.from(post));
  }

  async countByThreadId(threadId) {
    const template = `SELECT COUNT(id) FROM post WHERE "threadId" = $1`;
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
