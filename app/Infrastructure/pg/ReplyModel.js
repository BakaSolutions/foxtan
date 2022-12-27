const ReplyModelInterface = require('../../Adapter/Interface/ReplyModelInterface.js');
const Dialect = require('./Dialect.js');
const ReplyDTO = require('../../Domain/DTO/ReplyDTO.js');

class ReplyModelPostgre extends ReplyModelInterface {

  constructor(connection) {
    super();
    this.dialect = new Dialect(connection);
  }

  async create(reply) {
    try {
      const columns = ['fromId', 'toId'];
      const template = `
      INSERT INTO "reply"
      (${columns.map(c => '"' + c + '"').join(', ')})
      VALUES (${columns.map((c, i) => '$' + (i + 1))})
      RETURNING *
    `;
      const values = columns.map(attr => reply[attr]);
      const query = await this.dialect.executeQuery(template, values);
      return ReplyDTO.from(query[0]);
    } catch (e) {
      if ('23505' !== e.code) {
        throw e;
      }
    }
  }

  async readPostReferences(id) {
    const template = `
      SELECT *
      FROM "reply"
      WHERE "fromId" = $1
    `;
    const replies = await this.dialect.executeQuery(template, [ id ]);
    return replies.map(reply => ReplyDTO.from(reply));
  }

  async readPostReplies(id) {
    const template = `
      SELECT *
      FROM "reply"
      WHERE "toId" = $1
    `;
    const replies = await this.dialect.executeQuery(template, [ id ]);
    return replies.map(reply => ReplyDTO.from(reply));
  }

  async deleteRepliesByPostId(postId) {
    try {
      const template = `DELETE FROM "reply" WHERE "fromId" = $1 OR "toId" = $2`;
      const values = [ postId, postId ]; // No time to check if multiple $1 usage is possible.
      await this.dialect.executeQuery(template, values, {raw: true});
      return true;
    } catch {
      return false;
    }
  }

}

module.exports = ReplyModelPostgre;
