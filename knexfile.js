require
const ENV = process.env.NODE_ENV || "development";

const baseConfig = {
  client: "pg",
  migrations: {
    directory: "./db/migrations",
  },
  seeds: {
    directory: "./db/seeds",
  },
};

const customConfig = {
  development: {
    connection: {
      database: "sfc_register",
      user: 'postgres',
      password: 'postgres',
    },
  },
  test: {
    connection: {
      database: "sfc_register_test",
      user: 'postgres',
      password: 'postgres',
    },
  },
  production: {
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    },
  },
};

module.exports = { ...customConfig[ENV], ...baseConfig };