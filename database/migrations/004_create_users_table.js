exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('email').notNullable().unique();
    table.string('password_hash');
    table.string('first_name');
    table.string('last_name');
    table.boolean('is_active').defaultTo(false);
    table.boolean('is_verified').defaultTo(false);
    table.string('verification_token');
    table.timestamp('verification_token_expires');
    table.string('password_reset_token');
    table.timestamp('password_reset_token_expires');
    table.boolean('two_factor_enabled').defaultTo(false);
    table.string('two_factor_secret');
    table.string('google_id').unique();
    table.timestamp('last_login');
    table.integer('role_id').unsigned().defaultTo(2); // Default to 'user' role
    
    table.foreign('role_id').references('id').inTable('roles').onDelete('SET NULL');
    
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
