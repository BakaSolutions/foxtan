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
      id: 1,
      boardName: 't',
      headId: 1
    },
    {
      id: 2,
      boardName: 'test',
      headId: 3
    }
  ]).into('thread');
  await knex.withSchema(schema).insert([
    {
      id: 1,
      threadId: 1,
      text: '111'
    },
    {
      id: 2,
      threadId: 1,
      text: '222'
    },
    {
      id: 3,
      threadId: 2,
      text: '333'
    },
    {
      id: 4,
      threadId: 1,
      text: '444'
    }
  ]).into('post');
};
