var fs = require('fs');
var path = require('path');

var assert = require('assert-plus');

module.exports = function version(dirPath) {
	var packageConfig;

	assert.string(dirPath, 'dirPath must be a string');
	 packageConfig = fs.readFileSync(path.join(dirPath, 'package.json'));
	
	return JSON.parse(packageConfig).version;
}
