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

  async readManyByBoardAndPosts(boardName, numbers = []) {
    const template = `SELECT p.*
FROM post p
INNER JOIN thread t ON p."threadId" = t.id
WHERE t."boardName" = $1
AND (p.number = $2
  OR ${numbers.map((post, i) => 'p.number = $' + (i + 3)).join(' OR ')}
)`;
    const values = [ boardName, ...numbers ];
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

  async readByAttachmentHash(hash) {
    const template = `SELECT * FROM post WHERE $1 = ANY("attachments")`;
    const values = [ hash ];
    let posts = await this.dialect.executeQuery(template, values);
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
    try {
      const template = `DELETE FROM post WHERE "id" = $1`;
      const values = [ post.id ];
      await this.dialect.executeQuery(template, values, {raw: true});
      return true;
    } catch {
      return false;
    }
  }

  async deleteMany(posts) {
    const template = `DELETE FROM post
WHERE ${posts.map((post, i) => '("id" = $' + (i + 1) + ')').join(' OR ')}`;
    // TODO: `WHERE "id" IN (...)`?
    const values = posts.map(post => post.id);
    const query = await this.dialect.executeQuery(template, values, {raw: true});
    return query.rowCount || 0;
  }

}

module.exports = PostModelPostgre;
