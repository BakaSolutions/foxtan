const UserModelInterface = require('../../Adapter/Interface/UserModelInterface.js');
const Dialect = require('./Dialect.js');
const UserDTO = require('../../Domain/DTO/UserDTO.js');

class UserModelPostgre extends UserModelInterface {

  constructor(connection) {
    super();
    this.dialect = new Dialect(connection);
  }

  async create(user) {
    try {
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
    } catch (e) {
      if ('23505' !== e.code) {
        throw e;
      }
      return this.readOneByName(user.name);
    }
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
        (LOWER("name") = $1)
      OR
        (LOWER("email") = $2)
      LIMIT 1
    `;
    const query = await this.dialect.executeQuery(template, [ name?.toLocaleLowerCase(), email?.toLocaleLowerCase() ]);
    return query.length ? UserDTO.from(query[0]) : null;
  }

  async readOneByName(name) {
    const template = `
      SELECT *
      FROM "user"
      WHERE (LOWER("name") = $1)
      LIMIT 1
    `;
    const query = await this.dialect.executeQuery(template, [ name?.toLocaleLowerCase() ]);
    return query.length ? UserDTO.from(query[0]) : null;
  }

  async readOneByEmail(email) {
    const template = `
      SELECT *
      FROM "user"
      WHERE (LOWER("email") = $1)
      LIMIT 1
    `;
    const query = await this.dialect.executeQuery(template, [ email?.toLocaleLowerCase() ]);
    return query.length ? UserDTO.from(query[0]) : null;
  }

}

module.exports = UserModelPostgre;
