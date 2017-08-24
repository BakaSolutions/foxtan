const Common = require('../common');
const Post = require('../../models/json/post');
const Thread = require('../../models/json/thread');

let router = module.exports = require('express').Router();

['get', 'post'].forEach(function (method) {
  router[method]("/api/post.get", async function (req, res) {
    try {
      if (method === 'post') {
        await Common.parseForm(req);
      } else {
        req.body = req.query;
      }
      let out = await Post.read(req.body.boardName, req.body.postNumber);
      if (!out || out.length < 1) {
        return Common.throw(res, 404);
      }
      Common.removeInfoFromPost(out);
      res.json(out);
    } catch (e) {
      return Common.throw(res, 500, e);
    }
  });
});

router.post("/api/post.create", async function (req, res) {
  try {
    await Common.parseForm(req);
    let model = typeof req.body.threadNumber === 'undefined'
      ? Thread
      : Post;
    let query = await model.create(req.body);
    if (req.body.redirect) {
      return res.redirect(303, '/' + req.body.boardName + '/res/' + query.thread + '.json')
    }
    res.status(201).json(query);
  } catch (e) {
    return Common.throw(res, 500, e);
  }
});

// TODO: Create post.update

router.post("/api/post.delete", async function (req, res) {
  try {
    await Common.parseForm(req);
    if (typeof req.body.password === 'undefined' || req.body.password === '') {
      return Common.throw(res, 200, "Please, define a password");
    }

    let out = await Post.delete(req.body.boardName, req.body.postNumber, req.body.password);
    if (out.ok) {
      return res.status(200).json({
        "ok": out.ok
      });
    }
    Common.throw(res, 200, out.exists
        ? out.isPost
            ? "Wrong password"
            : "It doesn't seem a post!"
        : "It doesn't exist!");
  } catch (e) {
    return Common.throw(res, 500, e);
  }
});
