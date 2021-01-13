const db = require("../models");
const config = require("../config/app.config");
const request = require("request");
const NodeCache = require( "node-cache" );
const myCache = new NodeCache();

/**
 * @description gets the current active access key for YT API
 * @returns {String} the active key
 */
async function getCurrentKey() {
	const keys = config.YT.KEYS;
	const cacheKey = config.cacheKey;
	let keyIndex = myCache.get(cacheKey);
	// handle miss
	if (keyIndex == undefined) {
		keyIndex = 0;
	}
	return keys[keyIndex];
}


/**
 * @description changes the YT key to the one least recently used
 */
function incrementKeyIndex() {
	const totalKeys = config.YT.KEYS.length;
	const cacheKey = config.cacheKey;
	let keyIndex = myCache.get(cacheKey);
	// handle miss
	if (keyIndex == undefined) {
		keyIndex = 0;
	}
	myCache.set(cacheKey, (keyIndex + 1)%totalKeys);
}


/**
 * @description fetches the list of videos from YT for a given page
 * uses the first page if page-token is not present
 * @param {String} accessKey the accessKey for YT API
 * @param {String} [pageToken=null] the page token to be fetched, if any
 * @returns {Object} the list of videos with their snippet data
 */
function getVideoResults(accessKey, pageToken = null) {
	return new Promise((resolve, reject) => {
		const defaultThreshHold = new Date();
		// fetch results from today midnight onwards
		defaultThreshHold.setHours(0, 0, 0, 0);

		const options = {
		method: 'GET',
		url: config.YT.SEARCH_URL,
		qs: {
			 part: 'snippet',
			 maxResults: '50',
			 order: 'date',
			 q: config.YT.QUERY_ELEMENT,
			 publishedAfter: defaultThreshHold,
			 key: accessKey,
			 type: 'video',
			 pageToken: pageToken
		 },
		};
		request(options, (error, response, body) => {
			if (error) return reject(error);
			console.log(response.statusCode, accessKey);
			if (response.statusCode == 200) {
				return resolve(JSON.parse(body));
			}
			if (response.statusCode == 403) {
				incrementKeyIndex();
				return resolve({ notAuthorized : true });
			}
			return reject(Error({ msg: 'Error in YT videos fetching videos', log: body }));
		});
	});
}


/**
 * @description parses the videos and converts them to the DB model format
 *
 * @param {Object} videoObject list of videos returned by YT API
 * @returns {Object} DB model compliant video object
 */
function parseVideos(videoObject) {
	const videoItems = videoObject.items;
	const parsedVideos = videoItems.map((item) => {
		const itemSnippet = item.snippet;
		return {
			id: item.id.videoId,
			title: itemSnippet.title,
			description: itemSnippet.description,
			publishedOn: itemSnippet.publishTime,
			thumbnailUrl: itemSnippet.thumbnails.high.url,
			channelTitle: itemSnippet.channelTitle,
			channelId: itemSnippet.channelId,
			createdAt: new Date(Date.now()),
			updatedAt: new Date(Date.now())
		}
	});
	return parsedVideos
}


/**
 * @description inserts videos in the DB in batch
 *
 * @param {Array<Object>} videos array of video objects
 * @return {boolean} true, if insertion is successful
 */
async function bulkInsertVideos(videos) {
	if (!Array.isArray(videos) && !videos.length) {
		return true;
	}
	try {
		await db.videos.bulkCreate(videos);
		return true;
	} catch (err) {
		console.log('Error in inserting records to DB', JSON.stringify(err));
		throw err;
	}
}


/**
 * @description fetches the pageToken to be fetched next
 *
 * @return {String} the token of the page to be fetched
 */
async function getNextPageToken() {
	const pageTokenKey = config.pageTokenKey;
	let token = await myCache.get(pageTokenKey);
	return token || null;
}


/**
 * @description updates the next page token in cache
 *
 * @param {String} token the token to be set in cache
 * @return {Promise} containing response of cache update
 */
async function updateNextPageToken(token) {
	const pageTokenKey = config.pageTokenKey;
	return myCache.set(pageTokenKey, token);
}


/**
 * @description function that calls the YT API and fetches videos in DB
 *
 * @return {Number} the total number of records updated
 */
async function updateVideoFeed() {
	// gets least recently used key
	const [ key, pageToken ]  = await Promise.all([ getCurrentKey(), getNextPageToken() ]);
	const videoResults = await getVideoResults(key, pageToken);
	if (videoResults && videoResults.notAuthorized) {
		console.log('Updating access key', videoResults);
		return 0;
	}
	const parsedResults = parseVideos(videoResults);
	const nextPageToken = videoResults.nextPageToken;
	await Promise.all([ bulkInsertVideos(parsedResults), updateNextPageToken(nextPageToken) ]);
	return parsedResults.length || 0;
};

module.exports = {
	updateVideoFeed: updateVideoFeed
}
