const db = require("../models");
const config = require("../config/app.config");
const request = require("request");
const NodeCache = require( "node-cache" );
const myCache = new NodeCache();

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

async function getNextPageToken() {
	const pageTokenKey = config.pageTokenKey;
	let token = await myCache.get(pageTokenKey);
	return token || null;
}

async function updateNextPageToken(token) {
	const pageTokenKey = config.pageTokenKey;
	return myCache.set(pageTokenKey, token);
}

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