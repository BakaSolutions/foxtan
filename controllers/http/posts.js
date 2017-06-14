const Common = require('../common'),
    model = require('../../models/json/post');

let router = module.exports = require('express').Router();

/*['get', 'post'].forEach(function (method) {
  router[method]("/api/post.get", function (req, res) {
    // boardName & postNumber
    res.status(200).json(req.query);
  });
});*/

router.post("/api/post.get", async function (req, res) {
  await Common.parseForm(req);
  let out = await model.read(req.body.boardName, req.body.postNumber).catch(e => Common.throw(res, 500, e.code? e.code: e));
  if (out.length < 1)
    return Common.throw(res, 404);
  Common.removeInfo(out);
  res.status(200).json(out);
});

router.post("/api/post.create", async function (req, res) {
  await Common.parseForm(req);
  let query = await model.create(req.body).catch(e => Common.throw(res, 500, e));
  req.body.redirect?
      res.redirect(303, `/${req.body.boardName}/res/${query['posts_thread']}.json`) : res.status(201).json(query);
});

// TODO: Create post.update

router.post("/api/post.delete", async function (req, res) {
  await Common.parseForm(req);
  if (typeof req.body.password === 'undefined' || req.body.password === '')
    return Common.throw(res, 200, "Please, define a password");
  let out = await model.delete(req.body.boardName, req.body.postNumber, req.body.password);
  if (out.ok)
    res.status(200).json({"ok": typeof out.result === 'undefined'? 0 : out.result.affectedRows});
  else
    Common.throw(res, 200, out.exists? (out.isPost? "Wrong password" : "It doesn't seem a post!") : "It doesn't exist!");
});
