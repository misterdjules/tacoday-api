var bunyan = require('bunyan');
var assert = require('assert-plus');

var version = require('./src/version');
var apiServer = require('./src/api-server.js');

var logger = bunyan.createLogger({name: "tacoday-api"});
var SERVER_PORT = process.env.TACODAY_API_PORT || 8080;

function onServerCreated(err, server) {
  if (err) {
    throw new Error('Could not create server, reason: ' + err);
  }

  server.listen(SERVER_PORT, function onServerListen() {
    console.log('%s listening at %s', server.name, server.url);
  });
}

assert.string(process.env.FB_APP_TOKEN,
  'The FB_APP_TOKEN environment variable must be set');

assert.string(process.env.FB_APP_TARGET_PAGE,
  'The FB_APP_APP_TARGET_PAGE environment variable must be set');

apiServer.createServer({
    name: 'tacoday-api',
    version: version(__dirname),
    logger: logger
  }, onServerCreated);
