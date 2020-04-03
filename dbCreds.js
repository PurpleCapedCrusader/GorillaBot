const config = require("./config.json");

var dbCreds = {
  user: config.connUser,
  database: config.connDatabase,
  password: config.connPassword,
  host: config.connHost,
  port: config.connPort,
  max: config.connMax,
  idleTimeoutMillis: config.connIdleTimeoutMillis,
};

module.exports = dbCreds;