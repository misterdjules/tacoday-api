const fs = require('fs');
const path = require('path');

const assert = require('assert-plus');

function loadControllerFile(controllerFilePath, server, logger) {
  var controller;

  assert.string(controllerFilePath, 'controllerFilePath must be a string');
  assert.object(server, 'server must be an object');

  if (controllerFilePath.endsWith('.js')) {
    /*eslint-disable global-require */
    controller = require(controllerFilePath);
    /*eslint-enable global-require */
    if (typeof controller.init !== 'function') {
      throw new Error(`Could not initialize controller ${controllerFilePath} ` +
        'successfully, function named "init" is missing');
    }
    
    controller.init(server, logger);
  }

  return controller;
}

function getControllerNameFromFilePath(filepath) {
  assert.string(filepath, 'filepath must be a string');

  if (!filepath.endsWith('.js'))
    throw new Error('Controller file path must have .js extension');
  
  return path.basename(filepath, '.js');
}

function loadControllersFromDir(controllersDir, server, logger, callback) {
  var controllers;

  assert.object(server, 'server must be an object');
  assert.object(logger, 'logger must be an object');
  assert.func(callback, 'callback must be a function');

  controllers = {};

  fs.readdir(controllersDir,
    function onControllersRead(err, controllerFilesPaths) {
      var errMsg;

      if (err) {
        errMsg = 'Could not read controllers files from directory %s, ' +
          ' reason: ' + err;
        return callback(new Error(errMsg));
      }

      logger.info('controller files paths: %s', controllerFilesPaths);

      controllerFilesPaths.forEach(function (filePath) {
        var controllerInstance;
        var controllerAbsPath = path.join(controllersDir, filePath);
        var controllerName = getControllerNameFromFilePath(controllerAbsPath);

        controllerInstance = loadControllerFile(controllerAbsPath, server,
          logger);

        if (controllerInstance) {
          controllers[controllerName] = controllerInstance;
          logger.info('Loaded controller [%s] successfully', controllerName);
        }

      });

      return callback(null, controllers);
    });
}

module.exports = {
  loadControllersFromDir: loadControllersFromDir
};
