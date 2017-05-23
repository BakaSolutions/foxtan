const Common = require('../common');
var router = module.exports = require('express').Router();

router.get("/", (req, res) => {
  var r = {
    "message": "*catching* :3"
  };
  res.json(r);
});
