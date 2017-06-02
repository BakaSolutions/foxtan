const fs = require('fs'),
  db = require('../db/post'),
  path = require('path');

//const filePath = path.join(__dirname, '/../../public/');

let post = module.exports = {};

post.create = async function(fields) {
  let { board, name, email, subject, tripcode, capcode, body, password, sageru, sticked, locked, cycled } = fields;
  let queryData = await db.create(board, name, email, subject, tripcode, capcode, body, password, sageru, sticked, locked, cycled);
  console.log(queryData);
  //fs.writeFileSync(`${filePath}/${board}/res/${post_id}.json`, JSON.stringify(queryData));
};

post.read = async function(board, post_id) {
  //TODO: Return .json file if exists
  let queryData = await db.read(board, post_id);
  if (queryData.length < 1)
    return [];
  let q = queryData[0];
  delete q['posts_sticked'];
  delete q['posts_locked'];
  delete q['posts_cycled'];
  return q;
};

post.update = function(board, post_id) {
  //TODO
};

post.delete = async function(board, post_id) {
  await db.delete(board, post_id);
  //TODO: Delete post from JSON by picking
};

post.recreate = async function(board, post_id) {
  //TODO
};
