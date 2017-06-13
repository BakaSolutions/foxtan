const Common = require('../common'),
    model = require('../../models/json/thread');

let router = module.exports = require('express').Router();

router.get("/:board/res/:id.json", async function (req, res) {
  try {
    let out = await model.read(req.params.board, req.params.id).catch(e => Common.throw(res, 500, e));
    if(typeof out !== 'object' || 1 > out.length)
      return Common.throw(res, 404);
    out.forEach((post) => {
      delete post['posts_password'];
      if(post['posts_thread'] !== null) {
        delete post['posts_sticked'];
        delete post['posts_locked'];
        delete post['posts_cycled'];
      }
    });
    res.status(200).json(out);
  } catch (e) {
    console.log(e);
    Common.throw(res, 500);
  }
});

router.get("/:board/feed.json", function (req, res) {
  Common.throw(res, 501);
});

router.get("/:board/catalog.json", function (req, res) {
  Common.throw(res, 501);
});

router.post("/api/thread.create", async function (req, res) {
  await Common.parseForm(req);
  let query = await model.create(req.body);
  req.body.redirect?
    res.redirect(303, `/${query.board}/res/${query.thread}.json`) : res.status(201).json(query);
});

router.post("/api/thread.delete", async function (req, res) {
  await Common.parseForm(req);
  let out = await model.delete(req.body.boardName, req.body.postNumber);
  res.status(200).json({"ok": typeof out === 'undefined'? 0: out.affectedRows});
});
