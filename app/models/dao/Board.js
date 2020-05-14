const DAO = require('./super.js');

class BoardDAO extends DAO {

  constructor(connection, schema) {
    super(connection, schema + '.');
  }

  create(board) {
    throw new Error();
  }

  async readByName(boardName) {
    const template = `SELECT * FROM ${this._schema}board WHERE board.name = $1 LIMIT 1`;
    const values = [ boardName ];
    const query = await this._executeQuery(template, values);
    return query[0];
  }

  readAll({count, page} = {}) {
    const template = `SELECT * FROM ${this._schema}board`;
    let query = this._limitOffset(template, [], { count, page });
    return this._executeQuery(...query);
  }

  async getLastPostNumbers() {
    let template = `SELECT b.name, MAX(p.number)
FROM foxtan.post p, foxtan.thread t, foxtan.board b
WHERE p."threadId" = t.id
AND t."boardName" = b.name
GROUP BY b.name`;

    const query = await this._executeQuery(template);
    let out = {};
    for (let i = 0; i < query.length; i++) {
      let [key, value] = Object.values(query[i]);
      out[key] = value;
    }
    return out;
  }

  update(board) {
    throw new Error();
  }

  delete(board) {
    throw new Error();
  }
}

module.exports = BoardDAO;