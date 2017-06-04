let router = module.exports = require('express').Router();

router.get("/ping", function (req, res) {
  res.status(200).json( {"message": "*pong*"});
});
