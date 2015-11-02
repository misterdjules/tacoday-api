var assert = require('assert-plus');
var https = require('https');

var XRegExp = require('xregexp');

function init(server, logger) {
    server.get('/wotd', getWotd);
}

function getWotd(req, res, next) {
    assert.string(process.env.FB_APP_TOKEN,
		'The FB_APP_TOKEN environment variable must be set');

    assert.string(process.env.FB_APP_TARGET_PAGE,
        'The FB_APP_TARGET_PAGE environment variable must be set');
    
    var now = new Date();
	var today = now.toDateString();
    
    req.log.info('Querying FB API...');

    var fbApiReq = https.get('https://graph.facebook.com/' +
    	process.env.FB_APP_TARGET_PAGE +
        '?fields=posts' +
    	'&access_token=' + process.env.FB_APP_TOKEN,
    	function onResponse(fbApiRes) {
    		var resJsonString = '';

    		fbApiRes.on('data', function onData(data) {
    			resJsonString += data.toString();
    		});

    		fbApiRes.on('end', function onEnd() {
    			var responseObject;
    			var recentPosts;
                var mostRecentWotdFound;

                req.log.info({resJsonString: resJsonString},
                    'Got response from FB API');

    			try {
    				responseObject = JSON.parse(resJsonString);
    			} catch (err) {
                    req.log.error({err: err},
                        'Could not parse response from FB API');
    				return next(err);
    			}

    			if (!responseObject.posts || !responseObject.posts.data) {
                    req.log.error('Could not find data for recent posts');
    				return next(new Error('Cannot read recent posts'));
    			}

    			recentPosts = responseObject.posts.data;
    			if (!Array.isArray(recentPosts)) {
                    req.log.error({recentPosts: recentPosts},
                        'Error, recent posts should be an array');
    				return next(new Error('Cannot read recent posts'));	
    			}

                recentPosts.some(function eachPost(post) {
                    var word = getWotdFromPost(post);
                    if (word) {
                        req.log.info({wotd: word}, 'Found WOTD');
                        mostRecentWotdFound = {
                            word: word,
                            post: post
                        };

                        return true;
                    } else {
                        return false;
                        req.log.info('Could not find WOTD');                        
                    }
                });
    			
                if (mostRecentWotdFound &&
                    postCreatedAt(mostRecentWotdFound.post, today)) {
                    return res.send(mostRecentWotdFound.word);
                } else {
                    return next(new Error('Cannot find WOTD today :('));
                }
    		});
    	});

    fbApiReq.on('error', function onError(err) {
    	req.log.erro({err: err}, 'Error when querying FB API');
        return next(err);
    });
}

function postCreatedAt(post, day) {
	assert.object(post, 'post must be an object');
	assert.string(day, 'day must be a string');

	return new Date(post.created_time).toDateString() === day;
}

function getWotdFromPost(post) {
	assert.object(post, 'post must be an object');

	if (post.message === undefined ||
		typeof post.message !== 'string')
		return;

	// \\pL represents the Unicode category for letters,
    // which matches ASCII letters, but also other letters found
    // in other languages, including "ñ" (n with a tilda on top) and other
    // letters commonly used in the spanish language that are not within the
    // set of ASCII characters matched by the original "\w" regexp category.
    //
    // We also use [ ] instead of \s here because according to my tests in
    // Node.js' REPL, \s wouldn't work as expected with this regexp when
    // using the 'regexp' module instead of the native regexp literals, whereas
    // [ ] would work. Since they're equivalent and we need the third-party
    // regexp module to support unicode letter categories, we use [ ].
    var wotdRegexp = XRegExp('#WOTD\:[ ]*?(\\pL+)', 'i');
    var match = post.message.match(wotdRegexp);
	if (match)
		return match[1];
}

exports.init = init;
