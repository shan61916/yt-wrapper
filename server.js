const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const updateDBJob = require("./app/controllers/video-update-job");
const isDropTable = process.env.ACTIVE_ENV === 'TESTING';

const app = express();

var corsOptions = {
	origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

const db = require("./app/models");

// drop the table if it already exists, when ACTIVE_ENV = TESTING
db.sequelize.sync({ force: isDropTable }).then(() => {
  if (isDropTable) {
    console.log("Drop and re-sync db.");
  }
});

// sample route
app.get("/", (req, res) => {
	res.json({ message: "Welcome to the Youtube-wrapper API" });
});

require("./app/routes/videos.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;


app.listen(PORT, async () => {
	console.log(`Server is running on port ${PORT}.`);
});
