module.exports = {
  init: (app) => {

    app.get("/", (req, res) => {
      let r = {
        "message": "*says 'Rawr!'* :3"
      };
      res.json(r);
    });

  }
};
