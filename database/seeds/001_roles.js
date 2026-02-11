exports.seed = function(knex) {
  return knex('roles')
    .del()
    .then(function () {
      return knex('roles').insert([
        { id: 1, name: 'admin', description: 'Administrator with full access' },
        { id: 2, name: 'user', description: 'Regular user with basic access' },
        { id: 3, name: 'moderator', description: 'Moderator with limited admin access' },
      ]);
    });
};
