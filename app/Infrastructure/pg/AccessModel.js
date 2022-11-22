const AccessModelInterface = require('../../Adapter/Interface/AccessModelInterface.js');
const Dialect = require('./Dialect.js');
const AccessDTO = require('../../Domain/DTO/AccessDTO.js');

class AccessModelPostgre extends AccessModelInterface {

  constructor(connection) {
    super();
    this.dialect = new Dialect(connection);
  }

  async create(board) {
    const columns = ['appliesToBoard', 'appliesToThread', 'access'];
    const template = `INSERT INTO "access"
        (${columns.map(c => '"' + c + '"').join(', ')})
        VALUES (${columns.map((c, i) => '$' + (i + 1))})
        RETURNING *`;
    const values = board.toArray();
    const query = await this.dialect.executeQuery(template, values);
    return AccessDTO.from(query[0]);
  }

  async readOne(id) {
    const template = `
      SELECT *
      FROM "access"
      WHERE
        id = $1
      LIMIT 1
    `;
    const query = await this.dialect.executeQuery(template, [ id ]);
    return AccessDTO.from(query[0]);
  }

  async readMany(idArray) {
    const template = `
      SELECT *
      FROM "access"
      WHERE "id" = ANY ($1)
    `;
    const query = await this.dialect.executeQuery(template, [ idArray ]);
    return query.map(access => AccessDTO.from(access));
  }

}

module.exports = AccessModelPostgre;
