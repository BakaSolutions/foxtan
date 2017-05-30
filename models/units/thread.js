const //fs = require('fs'),
  db = require('../sql');

let thread = module.exports = {};

thread.create = function(board, thread_id) {
  //fs.writeFileSync('thread_' + thread_id + '.json', JSON.stringify(queryData));
};

thread.read = function(board, thread_id) {
  return db.promisify((r, j) => {
    db.query('SELECT * FROM ?? WHERE (`posts_id` = ? AND `posts_thread` IS NULL) OR `posts_thread` = ?', ['posts_' + board, thread_id, thread_id], function (err, queryData) {
      if (err) j(err);
      r(queryData);
    })
  });
};

thread.update = function(board, thread_id, post_id) {
  //fs.appendFileSync('thread_' + thread_id + '.json', JSON.stringify(queryData));
};

thread.delete = function(board, thread_id) {
  //fs.unlinkSync('thread_' + thread_id + '.json');
};

thread.recreate = function(board, thread_id) {
  return db.promisify((r, j) => {
    db.query('SELECT * FROM ?? WHERE (`posts_id` = ? OR `posts_thread` = ?)', ['posts_' + board, thread_id, thread_id], function (err, queryData) {
      if (err) j(err);
      r(queryData);
      //fs.writeFileSync('thread_' + thread_id + '.json', JSON.stringify(queryData));
    });
  });
};

/*let start = +new Date(); //TODO: tests
for (let i = 0; i < 100000; i++) {
  thread.read('test', 1);
}
console.log(+new Date() - start);*/
