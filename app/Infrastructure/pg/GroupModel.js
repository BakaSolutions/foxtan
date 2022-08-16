const GroupModelInterface = require('../../Adapter/Interface/GroupModelInterface.js');
const Dialect = require('./Dialect.js');
const GroupDTO = require('../../Domain/DTO/GroupDTO.js');

class GroupModelPostgre extends GroupModelInterface {

  constructor(connection) {
    super();
    this.dialect = new Dialect(connection);
  }

  async create(group) {
    try {
      const columns = ['name', 'privilegesId', 'description'];
      const template = `
      INSERT INTO "group"
      (${columns.map(c => '"' + c + '"').join(', ')})
      VALUES (${columns.map((c, i) => '$' + (i + 1))})
      RETURNING *
    `;
      const values = columns.map(attr => group[attr]);
      const query = await this.dialect.executeQuery(template, values);
      return GroupDTO.from(query[0]);
    } catch (e) {
      if ('23505' !== e.code) {
        throw e;
      }
      return this.readOneByName(group.name);
    }
  }

  async readOneByName(name) {
    const template = `
      SELECT *
      FROM "group"
      WHERE (LOWER("name") LIKE $1)
      LIMIT 1
    `;
    const query = await this.dialect.executeQuery(template, [ `%${name}%` ]);
    return query.length ? GroupDTO.from(query[0]) : null;
  }

}

module.exports = GroupModelPostgre;
