var assert = require('assert-plus');
var https = require('https');

function init(server, logger) {
    server.get('/wotd', getWotd);
}

function getWotd(req, res, next) {
    assert.string(process.env.FB_APP_TOKEN,
		'The FB_APP_TOKEN environment variable must be set');
    
    var now = new Date();
	var today = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' +
		now.getDate();
    
    var req = https.get('https://graph.facebook.com/LaTaqueria' +
    	'?fields=posts' +
    	'&access_token=' + process.env.FB_APP_TOKEN,
    	function onResponse(fbRes) {
    		var resJsonString = '';

    		fbRes.on('data', function onData(data) {
    			resJsonString += data.toString();
    		});

    		fbRes.on('end', function onEnd() {
    			var responseObject;
    			var recentPosts;

    			try {
    				responseObject = JSON.parse(resJsonString);
    			} catch (err) {
    				return next(err);
    			}

    			if (!responseObject.posts || !responseObject.posts.data) {
    				return next(new Error('Cannot read recent posts'));
    			}

    			recentPosts = responseObject.posts.data;
    			if (!Array.isArray(recentPosts)) {
    				return next(new Error('Cannot read recent posts'));	
    			}

    			recentPosts.forEach(function (post) {
    				var wotd;
    				if (postCreatedAt(post, today)) {
    					wotd = getWotdFromPost(post);
    					if (wotd) {
    						return res.send(wotd);
    					} else {
    						next(new Error('Cannot find WOTD today :('));
    					}
    				}
    			});
    		});
    	});

    req.on('error', function onError(err) {
    	return next(err);
    });
}

function postCreatedAt(post, day) {
	assert.object(post, 'post must be an object');
	assert.string(day, 'day must be a string');

	return post.created_time.startsWith(day);
}

function getWotdFromPost(post) {
	assert.object(post, 'post must be an object');

	if (post.message === undefined ||
		typeof post.message !== 'string')
		return;

	var match = post.message.match(/#WOTD\:\s*?(\w+)/i);
	if (match)
		return match[1];
}

exports.init = init;
