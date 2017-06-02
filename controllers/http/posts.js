const Common = require('../common'),
    model = require('../../models/json/post');

let router = module.exports = require('express').Router();

/*['get', 'post'].forEach(function (method) {
  router[method]("/api/post.get", (req, res) => {
    // boardName & postNumber
    res.status(200).json(req.query);
  });
});*/

router.post("/api/post.get", async function (req, res) {
  let out = await model.read(req.body.boardName, req.body.postNumber);
  if(out.length < 1)
    return Common.throw(res, 404);
  res.status(200).json(out);
});

router.post("/api/post.create", (req, res) => {
  Common.throw(res, 501);
});
