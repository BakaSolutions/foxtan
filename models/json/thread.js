const fs = require('fs'),
  db = require('../db/thread'),
  path = require('path');

const filePath = path.join(__dirname, '/../../public/');

let thread = module.exports = {};

thread.create = async function(fields) {
  let { board, name, email, subject, tripcode, capcode, body, password, sageru, sticked, locked, cycled } = fields;
  let queryData = await db.create(board, name, email, subject, tripcode, capcode, body, password, sageru, sticked, locked, cycled);
  console.log(queryData);
  //fs.writeFileSync(`${filePath}/${board}/res/${thread_id}.json`, JSON.stringify(queryData));
};

thread.read = async function(board, thread_id) {
  //TODO: Return .json if exists
  let queryData = await db.read(board, thread_id);
  return queryData;
};

thread.update = async function(board, thread_id, post_id) {
  let queryData = await db.update(board, thread_id, post_id);
  fs.appendFileSync('thread_' + thread_id + '.json', JSON.stringify(queryData));
};

thread.recreate = async function(board, thread_id) {
  let queryData = await db.recreate(board, thread_id);
  fs.writeFileSync(`${filePath}/${board}/res/${thread_id}.json`, JSON.stringify(queryData));
};

thread.delete = async function(board, thread_id) {
  await db.delete(board, thread_id);
  fs.unlinkSync(`${filePath}/${board}/res/${thread_id}.json`);
};