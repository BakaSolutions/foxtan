const db = require('../sql'),
  Tools = require('../../helpers/tools');

let board = module.exports = {},
  queries =
  {
    create: 'CREATE TABLE `posts_??` (' +
      '`posts_id` int(11) unsigned NOT NULL AUTO_INCREMENT,' +
      '`posts_thread` int(11) unsigned DEFAULT NULL,' +
      '`posts_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,' +
      '`posts_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,' +
      '`posts_subject` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,' +
      '`posts_tripcode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,' +
      '`posts_capcode` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,' +
      '`posts_body` longtext COLLATE utf8mb4_unicode_ci,' +
      '`posts_bodymarkup` longtext COLLATE utf8mb4_unicode_ci,' +
      '`posts_password` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,' +
      '`posts_files` mediumtext COLLATE utf8mb4_unicode_ci,' +
      '`posts_filesamount` tinyint(4) unsigned DEFAULT NULL,' +
      '`posts_fileshash` mediumtext COLLATE utf8mb4_unicode_ci,' +
      '`posts_sageru` tinyint(4) DEFAULT NULL,' +
      '`posts_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
      '`posts_sticked` tinyint(4) DEFAULT NULL,' +
      '`posts_locked` tinyint(4) DEFAULT NULL,' +
      '`posts_cycled` tinyint(4) DEFAULT NULL,' +
      '`posts_embed` mediumtext COLLATE utf8mb4_unicode_ci,' +
      'PRIMARY KEY (`posts_id`),' +
      'UNIQUE KEY `posts_id_UNIQUE` (`posts_id`)' +
      ') ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;'
  };

/**
 * Create a board
 * @param {Object} fields
 * @return {Promise}
 */
board.create = function(fields)
{
  let { uri, name } = fields;
  return db.promisify(function (resolve, reject)
  {
    db.query('INSERT INTO ?? (uri, name, posts) VALUES (?, ?, ?)',
      ['boards', uri, name, 0], function (err, result)
      {
        if (err) reject(err);
        db.query(queries.create, [uri], function (error)
        {
          if (error) reject(error);
          resolve(result);
        });
      });
  });
};

/**
 * Read a board with defined uri
 * @param {String} uri
 * @return {Promise}
 */
board.read = async function(uri)
{
  return db.promisify(function (resolve, reject)
  {
    db.query('SELECT * FROM ?? WHERE `uri` = ? LIMIT 1', ['boards', uri], function (err, queryData)
    {
      if (err) reject(err);
      resolve(typeof queryData !== 'undefined'? (queryData[0] || []) : null);
    })
  });
};

/**
 * Read all boards
 * @return {Promise}
 */
board.readAll = async function()
{
  return db.promisify(function (resolve, reject)
  {
    db.query('SELECT * FROM boards', null, function (err, queryData)
    {
      if (err) reject(err);
      resolve(queryData);
    })
  });
};

/**
 * Update a board with defined name
 * @param {String} boardNameOld
 * @param {Object} fields
 * @return {Promise}
 */
board.update = function(boardNameOld, fields)
{
  let { href, boardName } = fields;
  return db.promisify(function (resolve, reject)
  {
    db.query('UPDATE ?? SET `uri`=?, `name`=? WHERE `name`=?',
      ['boards', href, boardName, boardNameOld], function (err, result)
      {
        if (err) reject(err);
        resolve(result);
      });
  });
};

/**
 * Delete a board with defined id
 * @param {String} boardName
 * @param {String} password
 * @return {Promise}
 */
board.delete = function(boardName, password)
{
  return db.promisify(function (resolve, reject)
  {
    db.query('DELETE FROM ?? WHERE `name`=? AND `password`=?',
        ['boards', boardName, password], function (err, result)
        {
          if (err) reject(err);
          resolve(result);
        });
  })
};

/**
 * Increment a post counter of a board with defined uri
 * @param {String} boardName
 * @param {Number} counter
 * @return {Promise}
 */
board.incrementCounter = function(boardName, counter = 1)
{
  return db.promisify(function (resolve, reject)
  {
    if (!Tools.isNumber(counter))
    {
      counter = 1;
    }
    db.query(`UPDATE ?? SET posts = posts + ? WHERE \`uri\`=?`,
      ['boards', counter, boardName], function (err, result)
        {
          if (err) reject(err);
          resolve(result);
        });
  })
};

/**
 * Get number of posts of a board with defined uri
 * @param {String, Array} boardNames
 * @return {Promise}
 */
board.getCounters = async function(boardNames)
{
  if (typeof boardNames === 'undefined')
  {
    boardNames = await board.readAll();
    boardNames = boardNames.map(function(board)
    {
      return board.uri;
    })
  }
  if (!Array.isArray(boardNames))
  {
    boardNames = [ boardNames ];
  }
  let query = 'SELECT uri, posts FROM ?? WHERE',
    qArray = ['boards'];
  for (let i = 0; i < boardNames.length; i++)
  {
    qArray.push(boardNames[i]);
    if (i !== 0) query += ' OR ';
    query += '`uri` = ?'
  }
  return db.promisify(function (resolve, reject)
  {
    db.query(query, qArray, function (err, result)
    {
        if (err) reject(err);
        result = result.map(function(board)
        {
          let o = {};
          o[board.uri] = board.posts;
          return o;
        });
      resolve(result);
      });
  })
};
