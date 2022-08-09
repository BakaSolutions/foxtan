const InviteModelInterface = require('../../Adapter/Interface/InviteModelInterface.js');
const Dialect = require('./Dialect.js');
const InviteDTO = require('../../Domain/DTO/InviteDTO.js');

class InviteModelPostgre extends InviteModelInterface {

  constructor(connection) {
    super();
    this.dialect = new Dialect(connection);
  }

  async create(invite) {
    try {
      const columns = ['authorId', 'groupName', 'code'];
      const template = `
      INSERT INTO "invite"
      (${columns.map(c => '"' + c + '"').join(', ')})
      VALUES (${columns.map((c, i) => '$' + (i + 1))})
      RETURNING *
    `;
      const values = columns.map(attr => invite[attr]);
      const query = await this.dialect.executeQuery(template, values);
      return InviteDTO.from(query[0]);
    } catch (e) {
      if ('23505' !== e.code) {
        throw e;
      }
      return this.readOneById(invite.id);
    }
  }

  async readOneById(id) {
    const template = `
      SELECT *
      FROM "invite"
      WHERE "id" = $1
      LIMIT 1
    `;
    const query = await this.dialect.executeQuery(template, [ id ]);
    return query.length ? InviteDTO.from(query[0]) : null;
  }

  async readOneByAuthorId(authorId) {
    const template = `
      SELECT *
      FROM "invite"
      WHERE "authorId" = $1
      LIMIT 1
    `;
    const query = await this.dialect.executeQuery(template, [ authorId ]);
    return query.length ? InviteDTO.from(query[0]) : null;
  }

  async readOneByCode(code) {
    const template = `
      SELECT *
      FROM "invite"
      WHERE "code" = $1
      LIMIT 1
    `;
    const query = await this.dialect.executeQuery(template, [ code ]);
    return query.length ? InviteDTO.from(query[0]) : null;
  }

  async setExpired({ code }, date = +new Date()) {
    const template = `
      UPDATE "invite"
      SET "expiredAt" = $1
      WHERE "code" = $2
    `;
    const query = await this.dialect.executeQuery(template, [ date, code ]);
    return query.length ? InviteDTO.from(query[0]) : null;
  }
}

module.exports = InviteModelPostgre;
