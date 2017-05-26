const Common = require('../common');

let router = module.exports = require('express').Router();

router.get("/post.json", (req, res) => {
  // boardName & postNumber
  Common.throw(res, 501);
});

router.post("/create/post", (req, res) => {
  Common.throw(res, 501);
});
