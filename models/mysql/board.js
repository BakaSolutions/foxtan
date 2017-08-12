const db = require('../sql'),
  Tools = require('../../helpers/tools');

let board = module.exports = {},
  queries = {
    create: 'CREATE TABLE IF NOT EXISTS ?? (' +
      '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,' +
      '`thread` int(11) unsigned DEFAULT NULL,' +
      '`name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,' +
      '`email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,' +
      '`subject` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,' +
      '`tripcode` varchar(24) COLLATE utf8mb4_unicode_ci DEFAULT NULL,' +
      '`capcode` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,' +
      '`body` longtext COLLATE utf8mb4_unicode_ci,' +
      '`bodymarkup` longtext COLLATE utf8mb4_unicode_ci,' +
      '`password` varchar(42) COLLATE utf8mb4_unicode_ci DEFAULT NULL,' +
      '`files` mediumtext COLLATE utf8mb4_unicode_ci,' +
      '`filesamount` tinyint(4) unsigned DEFAULT NULL,' +
      '`fileshash` mediumtext COLLATE utf8mb4_unicode_ci,' +
      '`sageru` tinyint(4) DEFAULT NULL,' +
      '`lastbump` datetime DEFAULT NULL,' +
      '`options` tinyint(4) DEFAULT NULL,' +
      '`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
      '`updated_at` datetime DEFAULT NULL,' +
      '`bumped_at` datetime DEFAULT NULL,' +
      '`deleted_at` datetime DEFAULT NULL,' +
      'PRIMARY KEY (`id`),' +
      'UNIQUE KEY `id_UNIQUE` (`id`)' +
      ') ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;'
  };

/**
 * Creates a board entry, also creates a table for posts
 * @param {Object} fields
 * @return {Promise} -- with OkPacket or an error
 */
board.create = function(fields) {
  let { uri, title, subtitle } = fields;
  return db.promisify(function (resolve, reject) {
    db.query('INSERT INTO ?? (uri, title, subtitle, posts) VALUES (?, ?, ?, ?)',
      ['boards', uri, title, subtitle, 0], function (err, result) {
        if (err) {
          return reject(err);
        }
        db.query(queries.create, ['posts_' + uri], function (error, res) {
          if (error) reject(error);
          resolve(result);
        });
      });
  });
};

/**
 * Reads a board with defined boardName
 * @param {String} boardName
 * @return {Promise} -- with board entries or an error
 */
board.read = async function(boardName) {
  return db.promisify(function (resolve, reject) {
    db.query('SELECT * FROM ?? WHERE `uri` = ? LIMIT 1', ['boards', boardName], function (err, queryData) {
      if (err) {
        reject(err);
      }
      resolve(
        Array.isArray(queryData) && queryData[0] && queryData[0].constructor.name === 'RowDataPacket'
          ? queryData[0]
          : null
      );
    })
  });
};

/**
 * Reads all boards
 * @param {Boolean} includeHidden
 * @return {Promise}
 */
board.readAll = async function(includeHidden) {
  let query = 'SELECT * FROM boards';
  if (includeHidden) {
    query += ' WHERE `hidden` = ?';
  }
  return db.promisify(function (resolve, reject) {
    db.query(query, [1], function (err, queryData) {
      if (err) {
        reject(err);
      }
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
board.update = function(boardNameOld, fields) {
  let { uri, title, subtitle } = fields;
  return db.promisify(function (resolve, reject) {
    db.query('UPDATE ?? SET `uri`=?, `title`=?, `subtitle`=? WHERE `name`=?',
      ['boards', uri, title, subtitle, boardNameOld], function (err, result) {
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
board.delete = function(boardName, password) {
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
board.incrementCounter = function(boardName, counter = 1) {
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
board.getCounters = async function(boardNames) {
  if (typeof boardNames === 'undefined') {
    boardNames = await board.readAll();
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
    query += '`uri` = ?';
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
