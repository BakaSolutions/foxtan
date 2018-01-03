const BoardModel = require('../../models/mongo/board');
const ThreadModel = require('../../models/mongo/thread');
const PostModel = require('../../models/mongo/post');
const CounterModel = require('../../models/mongo/counter');
const Tools = require('../../helpers/tools');
const config = require('../../helpers/config');

module.exports = [
  {
    command: 'GET',
    handler: get
  },
  {
    command: 'BOARD',
    handler: board
  },
];

async function get(command, message, id, ws, err) {
  let out;
  switch (message) {
    case "BOARDS":
      out = await BoardModel.readAll().then(boards => {
        let out = {};
        for (let i = 0; i < boards.length; i++) {
          let board = boards[i].board;
          delete boards[i].board;
          out[board] = boards[i];
        }
        return out;
      });
      out = JSON.stringify(out);
      break;
    case "LPN":
      //out = await BoardModel.getCounters();
      break;
    default:
      return err(ws, 404, id);
      break;
  }

  if (id) {
    out += id;
  } else {
    out = command + ' ' + out;
  }
  ws.send(out);
}

async function board(command, message, id, ws, err) {
  let out;
  message = message.split(' ');
  let board = message.shift();
  message = message.join('');

  switch (message) {
    case "COUNT":
      out = ThreadModel.countPage({
        board: board
      });
      break;
    default:
      let pageNumber = +message;
      if (!Tools.isNumber(+pageNumber)) {
        return err(ws, 404, id);
      }
      out = ThreadModel.readPage({
        board: board,
        page: pageNumber
      }).then(async page => {
        if (!page.length) {
          return err(ws, 404, id);
        }
        for (let i = 0; i < page.length; i++) {
          let opPost = await PostModel.readOne({
            board: board,
            post: +page[i].number
          });
          if (opPost === null) {
            let message = `There's a thread, but no OP-post: ${board}/${page[i].number}`;
            console.log(message);
            throw new Error(message);
          }
          page[i].posts = [ opPost ];

          let posts = await PostModel.readAll({
            board: board,
            thread: +page[i].number,
            order: 'createdAt',
            orderBy: 'DESC',
            limit: config('board.lastPostsNumber')
          });
          if (posts === null || !posts.length) {
            let message = `There's a thread, but no posts: ${board}/${page[i].number}`;
            console.log(message);
            throw new Error(message);
          }
          if (posts[posts.length - 1].number === posts[posts.length - 1].threadNumber) {
            posts.pop();
          }
          posts.reverse();
          page[i].posts.push(...posts);

          let count = await PostModel.count({
            whereKey: ['boardName', 'threadNumber'],
            whereValue: [board, +page[i].number]
          });
          page[i].omittedPosts = count - page[i].posts.length;
        }
        return page;
      }).then(async threads => {
        return {
          threads: threads,
          lastPostNumber: await CounterModel.readOne(board),
          pageCount: await ThreadModel.countPage({
            board: board
          })
        }
      });
      break;
  }
  out.then(out => {
    if (out === null) {
      return err(ws, 404, id);
    }

    out = JSON.stringify(out);

    if (id) {
      out += id;
    } else {
      out = command + ' ' + out;
    }
    ws.send(out);

  }).catch(e => {
    return err(ws, 500, id, e);
  });
}
