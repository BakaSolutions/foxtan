const schema = 'foxtan';

exports.up = knex => {
  return knex.schema
    .withSchema(schema)
    .table('attachment', table => {
      table.renameColumn('attachmentId', 'id')
    })
};

exports.down = knex => {
  return knex.schema
    .withSchema(schema)
    .table('attachment', table => {
      table.renameColumn('id', 'attachmentId')
    })
};
