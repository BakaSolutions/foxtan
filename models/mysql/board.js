const db = require('../sql'),
  Tools = require('../../helpers/tools');

let Board = module.exports = {},
  queries = {
    createBoard:
      `CREATE TABLE IF NOT EXISTS ?? (
        \`id\` int(11) unsigned NOT NULL AUTO_INCREMENT,
        \`thread\` int(11) DEFAULT NULL,
        \`name\` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        \`email\` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        \`subject\` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        \`tripcode\` varchar(24) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        \`capcode\` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        \`body\` longtext COLLATE utf8mb4_unicode_ci,
        \`bodymarkup\` longtext COLLATE utf8mb4_unicode_ci,
        \`password\` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        \`files\` mediumtext COLLATE utf8mb4_unicode_ci,
        \`filesamount\` tinyint(4) DEFAULT NULL,
        \`fileshash\` mediumtext COLLATE utf8mb4_unicode_ci,
        \`sageru\` tinyint(4) DEFAULT NULL,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime DEFAULT NULL,
        \`deleted_at\` datetime DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`posts_id_UNIQUE\` (\`id\`)
      ) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    createThread:
      `CREATE TABLE IF NOT EXISTS ?? (
        \`id\` int(11) NOT NULL,
        \`board_name\` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`thread_id\` int(11) NOT NULL,
        \`unbumpable\` tinyint(1) DEFAULT NULL,
        \`locked\` tinyint(1) DEFAULT NULL,
        \`sticked\` tinyint(1) DEFAULT NULL,
        \`cycled\` tinyint(1) DEFAULT NULL,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime DEFAULT NULL,
        \`deleted_at\` datetime DEFAULT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      /*!40101 SET character_set_client = @saved_cs_client */;`
  };

/**
 * Creates a board entry, also creates a table for posts
 * @param {Object} fields
 * @return {Promise} -- with OkPacket or an error
 */
Board.create = function(fields) {
  let { uri, title, subtitle } = fields;
  return db.promisify(function (resolve, reject) {
    db.query('INSERT INTO ?? (uri, title, subtitle, posts) VALUES (?, ?, ?, ?)',
      ['boards', uri, title, subtitle, 0], function (err, result) {
        if (err) {
          return reject(err);
        }
        db.query(queries.createBoard, ['posts_' + uri], function (err, res) {
          if (err) {
            return reject(err);
          }
          db.query(queries.createThread, ['threads_' + uri], function (err, res) {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });
      });
  });
};

/**
 * Reads boards
 * @param {String} [boardName]
 * @param {Number} [limit]
 * @param {Number} [offset]
 * @return {Promise} -- with board entries or an error
 */
Board.read = async function(boardName, limit, offset) {
  let query = 'SELECT * FROM ??';
  if (boardName) query += ' WHERE `uri` = ?';
  if (limit)  query += ' LIMIT ?';
  if (offset) query += ' OFFSET ?';

  let params = ['boards'];
  if (boardName) params.push(boardName);
  if (limit)     params.push(limit);
  if (offset)    params.push(offset);
  return db.promisify(function (resolve, reject) {
    db.query(query, params, function (err, queryData) {
      if (err) return reject(err);
      resolve(queryData);
    })
  });
};

/**
 * Reads a board with defined boardName
 * @param {String} boardName
 * @return {Promise} -- with board entries or an error
 */
Board.readOne = async function(boardName) {
  return (await Board.read(boardName, 1))[0] || false;
};

/**
 * Reads all boards
 * @param {Boolean} [includeHidden]
 * @param {String} [order]
 * @param {String} [orderBy]
 * @param {Number} [limit]
 * @param {Number} [offset]
 * @return {Promise}
 */
Board.readAll = async function(includeHidden, order, orderBy, limit, offset) {
  let query = 'SELECT * FROM boards';
  if (includeHidden) {
    query += ' WHERE `hidden` = ?';
  }
  if (order) {
    query += ' ORDER BY ?';
    if (order === 'ASC')  query += ' ASC';
    if (order === 'DESC') query += ' DESC';
  }
  if (limit)  query += ' LIMIT ?';
  if (offset) query += ' OFFSET ?';

  let params = [];
  if (includeHidden) params.push(includeHidden);
  if (order) params.push(orderBy);
  if (limit)  params.push(limit);
  if (offset) params.push(offset);
  return db.promisify(function (resolve, reject) {
    db.query(query, params, function (err, queryData) {
      if (err) return reject(err);
      resolve(
        Array.isArray(queryData) && queryData.length > 0 && queryData[0].constructor.name === 'RowDataPacket'
          ? queryData
          : null
      );
    })
  });
};

/**
 * Updates a board with defined name
 * @param {String} boardNameOld
 * @param {Object} fields
 * @return {Promise}
 */
Board.update = function(boardNameOld, fields) {
  let { boardName, title, subtitle } = fields;
  return db.promisify(function (resolve, reject) {
    db.query('UPDATE ?? SET `uri` = ?, `title` = ?, `subtitle` = ? WHERE `uri` = ?',
      ['boards', boardName, title, subtitle, boardNameOld], function (err, result) {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
  });
};

/**
 * Deletes a board with defined boardName
 * @param {String} boardName
 * @param {String} [password]
 * @return {Promise}
 */
Board.delete = function(boardName, password) {
  return db.promisify(function (resolve, reject) {
    db.query('DELETE FROM ?? WHERE `uri`=?',// AND `password`=?
        ['boards', boardName, password], function (err, result) {
          if (err) {
            reject(err);
          }
          resolve(result);
        });
  })
};

/**
 * Increments a post counter of a board with defined boardName
 * @param {String} boardName
 * @param {Number} counter
 * @return {Promise}
 */
Board.incrementCounter = function(boardName, counter = 1) {
  return db.promisify(function (resolve, reject) {
    if (!Tools.isNumber(counter)) {
      counter = 1;
    }
    db.query(`UPDATE ?? SET posts = posts + ? WHERE \`uri\`=?`,
      ['boards', counter, boardName], function (err, result) {
          if (err) {
            reject(err);
          }
          resolve(result);
        });
  })
};

/**
 * Gets number of posts of a board with defined boardNames
 * @param {String, Array} [boardNames]
 * @return {Promise} -- with an object or DB error
 */
Board.getCounters = async function(boardNames) {
  if (typeof boardNames === 'undefined') {
    boardNames = await Board.readAll();
    boardNames = boardNames.map(function(board) {
      return board.uri;
    })
  }
  if (!Array.isArray(boardNames)) {
    boardNames = [ boardNames ];
  }
  let query = 'SELECT uri, posts FROM ?? WHERE',
    qArray = ['boards'];
  for (let i = 0; i < boardNames.length; i++) {
    qArray.push(boardNames[i]);
    if (i !== 0) {
      query += ' OR ';
    }
    query += ' `uri` = ?';
  }
  return db.promisify(function (resolve, reject) {
    db.query(query, qArray, function (err, result) {
      if (err) reject(err);
      let o = {};
      result.map(function(board) {
        o[board.uri] = board.posts;
      });
      resolve(o);
    });
  })
};
