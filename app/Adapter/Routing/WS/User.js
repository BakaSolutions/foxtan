class UserController {

  constructor() {
    return [
      {
        request: 'whoami',
        middleware: async (_, ws) => {
          return ws.session?.user || {};
        }
      },
      {
        request: 'trustedpostcount',
        middleware: async (_, ws) => {
          return {
            trustedPostCount: ws.session?.trustedPostCount ?? 0
          };
        }
      }
    ];
  }

}

module.exports = UserController;
