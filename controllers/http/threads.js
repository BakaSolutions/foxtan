const Common = require('../common'),
    //Tools = require('../../helpers/tools.js'),
    model = require('../../models/json/thread');

let router = module.exports = require('express').Router();

router.get("/:board/res/:id.json", async (req, res) => {
  try {
    let out = await model.read(req.params.board, req.params.id);
    //out = JSON.parse(JSON.stringify(out));
    if(out.length < 1)
      return Common.throw(res, 404);
    out.forEach((post) => {
      delete post['posts_password'];
      if(post['posts_thread'] !== null) {
        delete post['posts_sticked'];
        delete post['posts_locked'];
        delete post['posts_cycled'];
      }
    });
    res.status(200).json({posts: out});
  } catch (e) {
    console.log(e);
    Common.throw(res, 500);
  }
});

router.get("/:board/feed.json", (req, res) => {
  Common.throw(res, 501);
});

router.get("/:board/catalog.json", (req, res) => {
  Common.throw(res, 501);
});

router.post("/api/thread.create", (req, res) => {
  res.status(200).json(req.body);
});
