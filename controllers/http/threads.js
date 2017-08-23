const Common = require('../common'),
    model = require('../../models/json/thread');

let router = module.exports = require('express').Router();

router.get("/:board/pageCount.json", async function (req, res) {
  try {
    let out = await model.pageCount(req.params.board, false);
    if (typeof out !== 'object' || out.length < 1) {
      return Common.throw(res, 404);
    }
    res.status(200).json(out);
  } catch (e) {
    return Common.throw(res, 500, e);
  }
});

router.get("/:board/:page.json", async function (req, res) {
  try {
    let out = await model.readPage(req.params.board, +req.params.page);
    if (typeof out !== 'object' || out.length < 1) {
      return Common.throw(res, 404);
    }
    for (let i = 0; i < out.threads.length; i++) {
      for (let j = 0; j < out.threads[i].lastPosts.length; j++) {
        Common.removeInfoFromPost(out.threads[i].lastPosts[j]);
      }
      if (out.threads[i].opPost) {
        Common.removeInfoFromPost(out.threads[i].opPost);
      }
    }
    res.status(200).json(out);
  } catch (e) {
    return Common.throw(res, 500, e);
  }
});

router.get("/:board/res/:id.json", async function (req, res) {
  try {
    let out = await model.read(req.params.board, req.params.id);
    if(typeof out !== 'object' || out.length < 1) {
      return Common.throw(res, 404);
    }
    Common.removeInfoFromPost(out.opPost);
    out.posts.forEach(function (post) {
      Common.removeInfoFromPost(post);
    });
    res.status(200).json(out);
  } catch (e) {
    return Common.throw(res, 500, e);
  }
});

router.get("/:board/feed.json", function (req, res) {
  Common.throw(res, 501);
});

router.get("/:board/catalog.json", function (req, res) {
  Common.throw(res, 501);
});

router.post("/api/thread.delete", async function (req, res) {
  try {
    await Common.parseForm(req);
    if (typeof req.body.password === 'undefined' || req.body.password === '') {
      return Common.throw(res, 200, "Please, define a password");
    }
    let out = await model.delete(req.body.boardName, req.body.postNumber, req.body.password);
    if (out.ok) {
      return res.status(200).json({
        "ok": out.ok
      });
    }
    Common.throw(res, 200, out.exists
      ? "Wrong password"
      : "It doesn't exist!");
  } catch (e) {
    return Common.throw(res, 500, e);
  }
});
