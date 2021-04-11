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
    const template = `SELECT * FROM foxtan.board b`;
    let query = Dialect.limitOffset(template, null, { count, page });
    query = Dialect.orderBy(...query, { orderBy: 'b.name', order });
    let boards = await this.dialect.executeQuery(...query);
    return boards.map(board => BoardDTO.from(board));
  }

  async getLastPostNumbers() {
    const template = `SELECT b.name, MAX(p.number)
FROM foxtan.post p, foxtan.thread t, foxtan.board b
WHERE p."threadId" = t.id
AND t."boardName" = b.name
GROUP BY b.name`;
    return this.dialect.executeQuery(template);
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