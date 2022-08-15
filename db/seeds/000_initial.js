const schema = 'foxtan';

exports.seed = async knex => {
  await knex.schema.withSchema(schema);
  await knex.withSchema(schema).insert([
    {
      name: 't',
      title: 'Tech support'
    },
    {
      name: 'test',
      title: 'Test board'
    }
  ]).into('board');
  await knex.withSchema(schema).insert([
    {
      //id: 1,
      boardName: 't'
    },
    {
      //id: 2,
      boardName: 'test',
    },
    {
      //id: 3,
      boardName: 't'
    },
    {
      //id: 4,
      boardName: 'test',
    },
    {
      //id: 5,
      boardName: 't'
    },
    {
      //id: 6,
      boardName: 'test',
    },
    {
      //id: 7,
      boardName: 't'
    },
    {
      //id: 8,
      boardName: 'test',
    },
  ]).into('thread');
  await knex.withSchema(schema).insert([
    {
      threadId: 1,
      number: 1,
      text: 'id 1, /t/, thread 1, post 1, OP'
    },
    {
      threadId: 1,
      number: 2,
      text: 'id 2, /t/, thread 1, post 2'
    },
    {
      threadId: 2,
      number: 1,
      text: 'id 3, /test/, thread 2, post 1, OP'
    },
    {
      threadId: 1,
      number: 3,
      text: 'id 4, /t/, thread 1, post 3'
    },
    {
      threadId: 2,
      number: 2,
      text: 'id 5, /test/, thread 2, post 2'
    },
    {
      threadId: 3,
      number: 4,
      text: 'id 6, /t/, thread 3, post 4, OP'
    },
    {
      threadId: 4,
      number: 3,
      text: 'id 7, /test/, thread 4, post 3, OP'
    },
    {
      threadId: 5,
      number: 5,
      text: 'id 8, /t/, thread 5, post 5, OP'
    },
    {
      threadId: 6,
      number: 4,
      text: 'id 9, /test/, thread 6, post 4, OP'
    },
    {
      threadId: 7,
      number: 6,
      text: 'id 10, /t/, thread 7, post 6, OP'
    },
    {
      threadId: 8,
      number: 5,
      text: 'id 11, /test/, thread 8, post 5, OP'
    },
    {
      threadId: 7,
      number: 7,
      text: 'id 12, /t/, thread 7, post 7'
    },
    {
      threadId: 8,
      number: 6,
      text: 'id 13, /test/, thread 8, post 6, sage',
      modifiers: ['sage']
    },
    {
      threadId: 8,
      number: 7,
      text: 'id 14, /test/, thread 8, post 7',
    },
    {
      threadId: 6,
      number: 8,
      text: 'id 15, /test/, thread 6, post 8, sage',
      modifiers: ['sage']
    }
  ]).into('post');
  await knex.withSchema(schema).insert([
    {
      id: 1,
      newBoardsPerDay: 999,
      newInvitesPerDay: 999
    }
  ]).into('privileges');
  await knex.withSchema(schema).insert([
    {
      id: 1,
      privilegesId: 1,
      name: 'Admin',
      email: 'admin@localhost',
      passwordHash: '04d9f19e9a814fd839f91675d7558e5669edeb13c489802645714f351f5b9d84',
      salt: '3di'
    }
  ]).into('user');
  await knex.withSchema(schema).insert([
    {
      name: 'Admin',
      privilegesId: 1,
      accessId: [ 1 ],
      description: 'Sample admin group'
    }
  ]).into('group');
  await knex.withSchema(schema).insert([
    {
      id: 1,
      groupName: 'Admin',
      userId: 1,
      invitedById: 1,
      invitedAt: new Date()
    }
  ]).into('member');
};
