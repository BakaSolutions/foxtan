const db = require('../sql');

let thread = module.exports = {};

thread.create = function (board, name, email, subject, tripcode, capcode, body, password, sageru, sticked, locked, cycled) {
  return db.promisify((r, j) => {
    db.query('INSERT INTO ?? (posts_name, posts_email, posts_subject, posts_tripcode, posts_capcode, posts_body, posts_password, posts_sageru, posts_sticked, posts_locked, posts_cycled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['posts_' + board, name, email, subject, tripcode, capcode, body, password, sageru, sticked, locked, cycled], function(err, result) {
        if (err) j(err);
        db.query('SELECT LAST_INSERT_ID()', null, function(err, result) {
          if (err) j(err);
          r(result);
        });
      });
  });
};

thread.read = function(board, id) {
  return db.promisify((r, j) => {
    db.query('SELECT * FROM ?? WHERE (`posts_id` = ? AND `posts_thread` IS NULL) OR `posts_thread` = ?', ['posts_' + board, id, id], function (err, queryData) {
      if (err) j(err);
      r(queryData);
    })
  });
};

thread.update = function(board, thread_id, post_id) {
  return db.promisify((r, j) => {
    db.query('SELECT * FROM ?? WHERE (posts_thread = ? AND posts_id >= ? )', ['posts_' + board, thread_id, post_id], function (err, queryData) {
      if (err) j(err);
      r(queryData);
    })
  });
};

thread.delete = function (board, id) {
  return db.promisify((r, j) => {
    db.query('DELETE FROM ?? WHERE (posts_id = ? OR posts_thread = ?)', ['posts_' + board, id, id], function (err, result) {
      if (err) j(err);
      r(result);
    });
  });
};

thread.recreate = function(board, id) {
  return db.promisify((r, j) => {
    db.query('SELECT * FROM ?? WHERE (`posts_id` = ? OR `posts_thread` = ?)', ['posts_' + board, id, id], function (err, queryData) {
      if (err) j(err);
      r(queryData);
    });
  });
};

/*let start = +new Date(); //TODO: tests
for (let i = 0; i < 100000; i++) {
  thread.read('test', 1);
}
console.log(+new Date() - start);*/
