const UserModelInterface = require('../../Adapter/Interface/UserModelInterface.js');
const Dialect = require('./Dialect.js');
const UserDTO = require('../../Domain/DTO/UserDTO.js');

class UserModelPostgre extends UserModelInterface {

  constructor(connection) {
    super();
    this.dialect = new Dialect(connection);
  }

  async create(user) {
    const columns = ['name', 'email', 'passwordHash', 'salt', 'registeredAt'];
    const template = `
      INSERT INTO "user"
      (${columns.map(c => '"' + c + '"').join(', ')})
      VALUES (${columns.map((c, i) => '$' + (i + 1))})
      RETURNING *
    `;
    const values = columns.map(attr => user[attr]);
    const query = await this.dialect.executeQuery(template, values);
    return UserDTO.from(query[0]);
  }

  async readOneById(id) {
    const template = `
      SELECT *
      FROM "user"
      WHERE
        id = $1
      LIMIT 1
    `;
    const query = await this.dialect.executeQuery(template, [ id ]);
    return query.length ? UserDTO.from(query[0]) : null;
  }

  async readOneByNameOrEmail({name, email}) {
    const template = `
      SELECT *
      FROM "user"
      WHERE
        (LOWER("name") LIKE $1)
      OR
        (LOWER("email") LIKE $2)
      LIMIT 1
    `;
    const query = await this.dialect.executeQuery(template, [ `%${name}%`, `%${email}%` ]);
    return query.length ? UserDTO.from(query[0]) : null;
  }

  async readOneByName(name) {
    const template = `
      SELECT *
      FROM "user"
      WHERE (LOWER("name") LIKE $1)
      LIMIT 1
    `;
    const query = await this.dialect.executeQuery(template, [ `%${name}%` ]);
    return query.length ? UserDTO.from(query[0]) : null;
  }

  async readOneByEmail(email) {
    const template = `
      SELECT *
      FROM "user"
      WHERE (LOWER("email") LIKE $1)
      LIMIT 1
    `;
    const query = await this.dialect.executeQuery(template, [ `%${email}%` ]);
    return query.length ? UserDTO.from(query[0]) : null;
  }

}

module.exports = UserModelPostgre;
