const PrivilegeModelInterface = require('../../Adapter/Interface/PrivilegeModelInterface.js');
const Dialect = require('./Dialect.js');
const PrivilegeDTO = require('../../Domain/DTO/PrivilegeDTO.js');

class PrivilegeModelPostgre extends PrivilegeModelInterface {

  constructor(connection) {
    super();
    this.dialect = new Dialect(connection);
  }

  async create(privileges) {
    try {
      const columns = ['newBoardsPerDay', 'newInvitesPerDay'];
      const template = `
      INSERT INTO "privileges"
      (${columns.map(c => '"' + c + '"').join(', ')})
      VALUES (${columns.map((c, i) => '$' + (i + 1))})
      RETURNING *
    `;
      const values = columns.map(attr => privileges[attr]);
      const query = await this.dialect.executeQuery(template, values);
      return PrivilegeDTO.from(query[0]);
    } catch (e) {
      if ('23505' !== e.code) {
        throw e;
      }
      return this.readOneById(privileges.id);
    }
  }

  async readOneById(id) {
    const template = `
      SELECT *
      FROM "privileges"
      WHERE "id" = $1
      LIMIT 1
    `;
    const query = await this.dialect.executeQuery(template, [ id ]);
    return query.length ? PrivilegeDTO.from(query[0]) : null;
  }

}

module.exports = PrivilegeModelPostgre;
