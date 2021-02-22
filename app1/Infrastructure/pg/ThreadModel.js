const ThreadModelInterface = require('../../Domain/ThreadModelInterface.js');
const Dialect = require('./Dialect.js');
const ThreadDTO = require('../ThreadDTO.js');

class ThreadModelPostgre extends ThreadModelInterface {

  constructor(connection) {
    super();
    this.dialect = new Dialect(connection);
  }

  async create(thread) {
    const template = `INSERT INTO foxtan.thread 
  ("boardName", "limitsId", "pinned", "modifiers") 
  VALUES ($1, $2, $3, $4)
  RETURNING *`;
    const values = thread.toArray();
    const query = await this.dialect.executeQuery(template, values);
    return ThreadDTO.from(query[0]);
  }

  async readOneById(id) {
    const template = `SELECT * FROM foxtan.thread WHERE id = $1 LIMIT 1`;
    const values = [ id ];
    const query = await this.dialect.executeQuery(template, values);
    return ThreadDTO.from(query[0]);
  }

  async readMany({ count, page, order } = {}) {
    throw new Error();
  }

  async update(thread) {
    throw new Error();
  }

  async deleteOne(thread) {
    throw new Error();
  }

  async deleteMany(thread) {
    throw new Error();
  }

}

module.exports = ThreadModelPostgre;
