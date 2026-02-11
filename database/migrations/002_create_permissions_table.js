exports.up = function(knex) {
  return knex.schema.createTable('permissions', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.text('description');
    table.string('resource').notNullable(); // e.g., 'users', 'posts', 'admin'
    table.string('action').notNullable(); // e.g., 'create', 'read', 'update', 'delete'
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('permissions');
};
