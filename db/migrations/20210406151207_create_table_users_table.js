exports.up = function(knex) {
  console.log('creating users table ...');
  return knex.schema.createTable('users', (usersTable=>{
      usersTable.increments('user_id').primary();
      usersTable.string('first_name').notNullable();
      usersTable.string('last_name').notNullable();
      usersTable.text('email').notNullable().unique();
      usersTable.timestamp('joined_at').defaultTo(knex.fn.now());
  }))
};

exports.down = function(knex) {
    console.log('removing users table...');
    return knex.schema.dropTable("users");
};