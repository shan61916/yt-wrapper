module.exports = (sequelize, Sequelize) => {
	const Videos = sequelize.define("videos", {
		id: {
			type: Sequelize.STRING,
			primaryKey: true,
		},
		title: {
			type: Sequelize.STRING,
		},
		description: {
			type: Sequelize.TEXT,
		},
		publishedOn: {
			type: Sequelize.DATE,
			defaultValue: Sequelize.NOW,
		},
		thumbnailUrl: {
			type: Sequelize.STRING,
		},
		channelId: {
			type: Sequelize.STRING,
		},
		channelTitle: {
			type: Sequelize.STRING,
		}
	},
	{
		indexes: [
			{
				name: 'publishedOn_index',
				using: 'BTREE', // to acheive the sorting criteria needs,
				fields: [
					"publishedOn",
				]
			}
		]
	});

	return Videos;
};
