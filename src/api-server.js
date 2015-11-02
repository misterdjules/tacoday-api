var assert = require('assert-plus');
var path = require('path');
var fs = require('fs');

var restify = require('restify');
var bunyan = require('bunyan');

function loadControllers(server, logger, callback) {
  assert.object(server, 'server must be an object');
  assert.object(logger, 'logger must be an object');
  assert.func(callback, 'callback must be a function');

  var controllers = {};

  var controllersDir = path.join(__dirname, 'api', 'endpoints');
  fs.readdir(controllersDir,
    function onControllersRead(err, controllerFilesPaths) {
      if (err) {
        var errMsg = 'Could not read controllers files from directory %s, ' +
          ' reason: ' + err;
        return callback(new Error(errMsg));
      }

      logger.info('controller files paths: %s', controllerFilesPaths);

      controllerFilesPaths.forEach(function requireControllerFile(controllerFilePath) {
        if (controllerFilePath.endsWith('.js')) {
          var controllerName = getControllerNameFromFilePath(controllerFilePath);
          var controller = require(path.join(controllersDir, controllerFilePath));
          if (typeof controller.init === 'function') {
            controller.init(server, logger);
          }

          controllers[controllerName] = controller;
          logger.info('Loaded controller [%s] successfully', controllerName);
        }
      });

      return callback(null, controllers);
    });
}

function getControllerNameFromFilePath(filepath) {
  assert.string(filepath, 'filepath must be a string');

  if (!filepath.endsWith('.js'))
    throw new Error('Controller file path must have .js extension');
  
  return path.basename(filepath, '.js');
}

function createServer(options, callback) {  
  if (typeof options === 'function' && callback === undefined) {
    callback = options;
    options = {};
  }

  if (typeof options !== 'object') {
    throw new Error('options parameter must be an object');
  }

  if (typeof callback !== 'function') {
    throw new Error('callback parameter must be a function');
  }

  if (options.logger !== undefined) {
    if (typeof options.logger !== 'object')
      throw new Error('options.logger must be an object');
  }

  var logger = options.logger || bunyan.createLogger({
    name: 'tacoday-api-server-logger'
  });

  var server = restify.createServer({
    name: 'tacoday-api',
    version: '1.0.0',
    log: logger
  });

  server.use(restify.requestLogger());
  server.use(restify.acceptParser(server.acceptable));
  server.use(restify.queryParser());

  loadControllers(server, logger, function onControllersLoaded(err, controllers) {
    if (err) {
      return callback(new Error('Could not load controllers, reason: ' + err));
    }
    
    return callback(null, server);
  });
}

exports.createServer = createServer;
