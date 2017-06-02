const db = require('../sql');

let post = module.exports = {};

post.create = function(board, thread, name, email, subject, tripcode, capcode, body, password, sageru) {
  return db.promisify((r, j) => {
    db.query('INSERT INTO ?? (posts_thread, posts_name, posts_email, posts_subject, posts_tripcode, posts_capcode,' +
        'posts_body, posts_password, posts_sageru) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['posts_' + board, thread, name, email, subject, tripcode, capcode, body, password, sageru], function (err, result) {
        if (err) j(err);
        r(result);
      });
  });
};

post.read = async function(board, id) {
  return db.promisify((r, j) => {
    db.query('SELECT * FROM ?? WHERE posts_id = ? LIMIT 1', ['posts_' + board, id], function (err, queryData) {
      if (err) j(err);
      r(queryData);
    })
  });
};

post.update = function(board, thread_id, post_id) {
  return db.promisify((r, j) => {
    //TODO
  });
};

post.delete = function(board, id) {
  return db.promisify((r, j) => {
    db.query('DELETE FROM ?? WHERE `posts_id` = ?', ['posts_' + board, id, id], function (err, result) {
      if (err) j(err);
      r(result);
    });
  });
};

/*let start = +new Date(); //TODO: tests
for (let i = 0; i < 100000; i++) {
  post.read('test', 1);
}
console.log(+new Date() - start);*/
