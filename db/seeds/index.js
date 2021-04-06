const {
    userData,
  } = require("../data/index.js");
  
  exports.seed = function (knex) {
    return knex.migrate
      .rollback()
      .then(() => {
        return knex.migrate.latest()
      })
      .then(() => {
        return knex('users')
        .insert(userData)
        .returning('*');
      });
  };