exports.up = function(knex) {
  return knex.schema.createTable('login_attempts', function(table) {
    table.increments('id').primary();
    table.string('email').notNullable();
    table.string('ip_address');
    table.string('user_agent');
    table.boolean('successful').defaultTo(false);
    table.timestamp('attempted_at').defaultTo(knex.fn.now());
    
    table.index(['email', 'attempted_at']);
    table.index(['ip_address', 'attempted_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('login_attempts');
};
