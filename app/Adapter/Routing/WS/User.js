class UserController {

  constructor() {
    return [
      {
        request: 'whoami',
        middleware: async (_, ws) => {
          return ws.session?.user || {};
        }
      }
    ];
  }

}

module.exports = UserController;
