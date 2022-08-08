const boardNameMaxLength = 10;
const passwordHashLength = 64;
const fileHashLength = 16;
const saltLength = 3;
const schema = 'foxtan';

exports.up = knex => {
  return knex.schema
    .createSchemaIfNotExists(schema)
    .withSchema(schema)
    .createTable('file', (table) => {
      table.string('hash', fileHashLength).primary();
      table.string('mime', 40);
      table.string('name', 255);
      table.smallint('width').unsigned();
      table.smallint('height').unsigned();
      table.integer('size').unsigned();
      table.specificType('modifiers', 'varchar[]');
    })
    .createTable('limits', (table) => {
      table.increments('id').unsigned().primary();
      table.float('captchaPosts');
      table.float('threadPerMinute');
      table.float('postsPerMinute');
      //table.float('threadCost');
      table.smallint('threadBumps').unsigned();
      //table.float('postCost');
      table.smallint('postFiles').unsigned();
      table.float('postFileSize');
      table.float('postTotalFileSize');
      table.smallint('postCharactersTop').unsigned();
      //table.smallint('postCharactersBottom').unsigned();
    })
    .createTable('board', (table) => {
      table.string('name', boardNameMaxLength).primary();
      table.integer('limitsId').unsigned();
      table.string('title', 20);
      table.string('defaultSubject', 60);
      table.string('description');
      table.specificType('modifiers', 'varchar[]');
      //table.string('locale', 5);
      table.timestamp('created').defaultTo(knex.fn.now());
      table.timestamp('deleled');

      table.foreign('limitsId').references('id').inTable(schema + '.limits');
    })
    .createTable('thread', (table) => {
      table.increments('id').unsigned().primary();
      table.string('boardName', boardNameMaxLength).notNullable();
      table.integer('limitsId').unsigned();
      table.smallint('pinned').unsigned();
      table.specificType('modifiers', 'varchar[]');

      table.foreign('boardName').references('name').inTable(schema + '.board');
      table.foreign('limitsId').references('id').inTable(schema + '.limits');
    })
    .createTable('post', (table) => {
      table.increments('id').unsigned().primary();
      table.integer('threadId').unsigned().notNullable();
      table.integer('userId').unsigned();
      table.integer('number').unsigned();
      table.string('subject', 60);
      table.text('text');
      table.string('sessionKey');
      table.specificType('modifiers', 'varchar[]');
      table.specificType('attachments', 'varchar[]');
      table.specificType('ipAddress', 'inet');
      table.timestamp('created').defaultTo(knex.fn.now());
      table.timestamp('updated');
      table.timestamp('deleled');

      table.foreign('threadId').references('id').inTable(schema + '.thread');
      setTimeout(() => {
        table.foreign('userId').references('id').inTable(schema + '.user');
      }, 1000);
    })
    .createTable('reply', (table) => {
      table.increments('id').unsigned().primary();
      table.integer('fromId').unsigned();
      table.integer('toId').unsigned();

      table.foreign('fromId').references('id').inTable(schema + '.post');
      table.foreign('toId').references('id').inTable(schema + '.post');
    })
    .createTable('ban', (table) => {
      table.increments('id').unsigned().primary();
      table.string('boardId', boardNameMaxLength);
      table.integer('threadId').unsigned();
      table.boolean('global');
      table.specificType('ipAddress', 'inet');
      table.timestamp('expiredAt');
      table.string('banType');

      table.foreign('boardId').references('name').inTable(schema + '.board');
      table.foreign('threadId').references('id').inTable(schema + '.thread');
    })
    .createTable('privileges', (table) => {
      table.increments('id').unsigned().primary();
      table.float('newBoardsPerDay');
      table.float('newInvitesPerDay');
    })
    .createTable('group', (table) => {
      table.string('name').primary();
      table.integer('privilegesId').unsigned();
      table.specificType('accessId', 'integer[]').unsigned();
      table.text('description');

      table.foreign('privilegesId').references('id').inTable(schema + '.privileges');
      //table.foreign('accessId').references('id').inTable(schema + '.access');
    })
    .createTable('user', (table) => {
      table.increments('id').unsigned().primary();
      table.integer('privilegesId').unsigned();
      table.specificType('accessId', 'integer[]').unsigned();
      //table.string('avatar');
      table.string('name');
      table.string('email');
      table.string('passwordHash', passwordHashLength);
      table.string('salt', saltLength);
      table.timestamp('registeredAt');
      table.timestamp('expiredAt');

      table.foreign('privilegesId').references('id').inTable(schema + '.privileges');
      //table.foreign('accessId').references('id').inTable(schema + '.access');
      //table.foreign('avatar').references('hash').inTable(schema + '.file');
    })
    .createTable('action', (table) => {
      table.increments('id').unsigned().primary();
      table.integer('authorId').unsigned();
      table.integer('userId').unsigned();
      table.integer('threadId').unsigned();
      table.integer('postId').unsigned();
      table.string('groupName');
      table.string('boardName', boardNameMaxLength);
      table.integer('banId').unsigned();
      table.string('action');
      table.text('comment');
      table.timestamp('commitedAt');

      table.foreign('authorId').references('id').inTable(schema + '.user');
      table.foreign('userId').references('id').inTable(schema + '.user');
      table.foreign('threadId').references('id').inTable(schema + '.thread');
      table.foreign('postId').references('id').inTable(schema + '.post');
      table.foreign('groupName').references('name').inTable(schema + '.group');
      table.foreign('boardName').references('name').inTable(schema + '.board');
      table.foreign('banId').references('id').inTable(schema + '.ban');
    })
    .createTable('access', (table) => {
      table.increments('id').unsigned().primary();
      table.specificType('appliesToBoard', 'varchar');
      table.integer('appliesToThread').unsigned();
      table.specificType('access', 'varchar[]');

      /*table.foreign('id').references('accessId').inTable(schema + '.group');
      table.foreign('id').references('accessId').inTable(schema + '.user');
      table.foreign('appliesToBoard').references('name').inTable(schema + '.board');
      table.foreign('appliesToThread').references('id').inTable(schema + '.thread');*/
    })
    .createTable('invite', (table) => {
      table.string('id').primary();
      table.integer('authorId').unsigned();
      table.string('groupName');
      table.string('code');
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('expiredAt');

      table.foreign('authorId').references('id').inTable(schema + '.user');
      table.foreign('groupName').references('name').inTable(schema + '.group');
    })
    .createTable('member', (table) => {
      table.increments('id').unsigned().primary();
      table.string('groupName');
      table.integer('userId').unsigned();
      table.integer('invitedById').unsigned();
      table.timestamp('invitedAt');
      table.timestamp('expiredAt');

      table.foreign('groupName').references('name').inTable(schema + '.group');
      table.foreign('userId').references('id').inTable(schema + '.user');
      table.foreign('invitedById').references('id').inTable(schema + '.user');
    })
    .createTable('marked', (table) => {
      table.increments('id').unsigned().primary();
      table.integer('postId').unsigned();
      table.integer('userId').unsigned();
      table.string('mark');

      table.foreign('postId').references('id').inTable(schema + '.post');
      table.foreign('userId').references('id').inTable(schema + '.user');
    });
};

exports.down = knex => {
  if (knex.client.config.client === 'pg') {
    return knex.raw(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  }
  return knex.dropSchemaIfExists(schema);
};
