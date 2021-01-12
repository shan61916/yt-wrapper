module.exports = app => {
	const videos = require("../controllers/videos.controller.js");

	var router = require("express").Router();

	// Retrieve paginated videos
	router.get("/", videos.getVideos);

	// Retrieve all videos where title matches searchText
	router.get("/search/:searchText", videos.videoSearch);


	app.use('/api/videos', router);
};
