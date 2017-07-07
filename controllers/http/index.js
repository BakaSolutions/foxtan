let router = module.exports = require('express').Router();

router.get("/", function (req, res) {
  res.status(200).json( {"message": "*pong*"} );
});
