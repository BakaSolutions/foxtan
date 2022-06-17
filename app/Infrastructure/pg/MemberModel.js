const MemberModelInterface = require('../../Adapter/Interface/MemberModelInterface.js');
const Dialect = require('./Dialect.js');
const MemberDTO = require('../../Domain/DTO/MemberDTO.js');

class MemberModelPostgre extends MemberModelInterface {

  constructor(connection) {
    super();
    this.dialect = new Dialect(connection);
  }

  async create(member) {
    const columns = ['groupName', 'userId', 'invitedById', 'invitedAt', 'expiredAt'];
    const template = `
      INSERT INTO "member"
      (${columns.map(c => '"' + c + '"').join(', ')})
      VALUES (${columns.map((c, i) => '$' + (i + 1))})
      RETURNING *
    `;
    const values = columns.map(attr => member[attr]);
    const query = await this.dialect.executeQuery(template, values);
    return MemberDTO.from(query[0]);
  }

  async readOneById(id) {
    const template = `
      SELECT *
      FROM "member"
      WHERE
        id = $1
      LIMIT 1
    `;
    const query = await this.dialect.executeQuery(template, [ id ]);
    return query.length ? MemberDTO.from(query[0]) : null;
  }

  async readOneByUserId(userId) {
    const template = `
      SELECT *
      FROM "member"
      WHERE
        userId = $1
      LIMIT 1
    `;
    const query = await this.dialect.executeQuery(template, [ userId ]);
    return query.length ? MemberDTO.from(query[0]) : null;
  }

  async readOneByGroupName(groupName) {
    const template = `
      SELECT *
      FROM "member"
      WHERE
        groupName = $1
      LIMIT 1
    `;
    const query = await this.dialect.executeQuery(template, [ groupName ]);
    return query.length ? MemberDTO.from(query[0]) : null;  }

}

module.exports = MemberModelPostgre;
