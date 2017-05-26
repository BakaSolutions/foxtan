let router = module.exports = require('express').Router();

router.get("/ping", (req, res) => {
  let r = {
    "message": "*pong*"
  };
  res.json(r);
});
