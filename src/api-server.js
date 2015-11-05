const assert = require('assert-plus');
const path = require('path');

const restify = require('restify');
const bunyan = require('bunyan');

const controllers = require('./controllers');

function createServer(options, callback) {  
  var logger;
  var server;
  var controllersDir;

  assert.object(options, 'options parameter must be an object');
  assert.func(callback, 'callback parameter must be a function');
  assert.optionalObject(options.logger, 'options.logger must be an object');

  logger = options.logger || bunyan.createLogger({
    name: 'api-server-logger'
  });

  server = restify.createServer({
    name: options.name,
    version: options.version,
    log: logger
  });

  server.use(restify.requestLogger());
  server.use(restify.acceptParser(server.acceptable));
  server.use(restify.queryParser());

  controllersDir = path.join(__dirname, 'api', 'endpoints');
  controllers.loadControllersFromDir(controllersDir, server, logger,
    function onControllersLoaded(err) {
      if (err) {
        return callback(new Error('Could not load controllers, reason: ' +
          err));
      }
      
      return callback(null, server);
    });
}

exports.createServer = createServer;
