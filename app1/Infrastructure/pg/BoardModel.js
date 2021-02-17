const BoardModelInterface = require('../../Domain/BoardModelInterface.js');
const Dialect = require('./Dialect.js');
const BoardDTO = require('../BoardDTO.js');

class BoardModelPostgre extends BoardModelInterface {

  constructor(connection) {
    super();
    this.dialect = new Dialect(connection);
  }

  async create(board) {
    const template = `INSERT INTO foxtan.board 
("name", "limitsId", "title", "defaultSubject", "description",
"modifiers", "created", "deleled") 
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *`;
    const values = board.toArray();
    const query = await this.dialect.executeQuery(template, values);
    return BoardDTO.from(query[0]);
  }

  async readOneByName(name) {
    const template = `SELECT * FROM foxtan.board WHERE name = $1 LIMIT 1`;
    const values = [ name ];
    const query = await this.dialect.executeQuery(template, values);
    return BoardDTO.from(query[0]);
  }

  async readMany({ count, page, order } = {}) {
    throw new Error();
  }

  async update(board) {
    throw new Error();
  }

  async deleteOne(board) {
    throw new Error();
  }

  async deleteMany(board) {
    throw new Error();
  }
}

module.exports = BoardModelPostgre;