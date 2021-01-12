const db = require("../models");
const config = require("../config/app.config");
const IndexHints = require("sequelize").IndexHints;
const Videos = db.videos;
const Op = db.Sequelize.Op;

/**
 * @description Public api that gets paginated list of videos(Sorted by publish time)queried
 * using index on 'publishedOn' attr
 * uses default pageLimit if not explicitly mentioned
 * @param {Object} req the request object
 * @param {Object} res the response object
 */
async function getVideos(req, res) {
	const limit = Number(req.query.limit || config.fetchLimit);
	const offset = Number(req.query.offset || 0);
	try {
		const results = await Videos.findAll({
			indexHints: [
				{ type : IndexHints.USE, values: [ 'publishedOn_index' ] }
			],
			offset: offset,
			limit: limit
		});
		res.status(200).send({ videos: results, nextOffset: offset + results.length });
	} catch (err) {
		console.log('Error in fetching video records', {
			event: Object.assign( {}, req.query, req.body),
			err: JSON.stringify(err)
		});
		res.status(500).send({
			message: 'Error retrieving Videos'
		});
	}
};


/**
 * @description gets the list of videos which match a given title fully or partially
 *
 * @param {Object} req the request object
 * @param {Object} res the response object
 */
async function videoSearch(req, res) {
	const limit = Number(req.query.limit || config.fetchLimit);
	const offset = Number(req.query.offset || 0);
	const searchText = req.params.searchText || '';
	try {
		const results = await Videos.findAll({
			offset: offset,
			limit: limit,
			where: db.Sequelize.where(
        db.Sequelize.fn('lower', db.Sequelize.col('title')),
        {
          [ Op.like ]: `%${searchText}%`
        }
      )
		});
		res.status(200).send({ videos: results, nextOffset: offset + results.length });
	} catch (err) {
		console.log('Error in fetching video records', {
			event: Object.assign( {}, req.query, req.body),
			err: JSON.stringify(err)
		});
		res.status(500).send({
			message: 'Error retrieving Videos'
		});
	}
};

module.exports = {
	getVideos: getVideos,
	videoSearch: videoSearch
}
