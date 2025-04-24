const express = require("express");
const mysql = require("mysql2");
const app = express();
//Database created with following command
//	mysql> CREATE DATABASE school_db
//use database to create table in it
//	mysql> use shool_db
//create table inside database
/*
mysql> CREATE TABLE school(
    -> id INT AUTO_INCREMENT PRIMARY KEY,
    -> name VARCHAR(100) NOT NULL,
    -> address VARCHAR(200) NOT NULL,
    -> latitude FLOAT NOT NULL,
    -> longitude FLOAT NOT NULL);
*/
//create pool to connect with database
const pool = mysql
	.createPool({
		host: "localhost",
		user: "root",
		password: "Admin@1234",
		database: "school_db",
		waitForConnections: true,
		connectionLimit: 10,
	})
	.promise();

app.use(express.json());
//following code for debugging purpose to check for connection
(async () => {
	try {
		const connection = await pool.getConnection();
		console.log("MySQL pool connected successfully");
		connection.release();
	} catch (error) {
		console.error("Failed to connect to MySQL pool:", error);
		process.exit(1); // Stop the app if DB connection fails
	}
})();
//post method to insert data into a school table
app.post("/addSchool", async (req, res) => {
	const { name, address, latitude, longitude } = req.body;
	if (
		!name ||
		!address ||
		typeof latitude !== "number" ||
		typeof longitude !== "number"
	) {
		return res.status(400).json({ error: "Invalid input data" });
	}
	try {
		const [result] = await pool.execute(
			"INSERT INTO school(name,address,latitude,longitude) VALUES(?,?,?,?)",
			[name, address, latitude, longitude],
		);
		res.status(201).json({ message: "School data inserted Sucessfully...." });
	} catch (err) {
		res.status(500).json({ message: "Error in inserting data" });
	}
});
//get method to retrive data from school table
app.get("/listSchools", async (req, res) => {
	const userLat = parseFloat(req.query.latitude);
	const userLon = parseFloat(req.query.longitude);

	if (isNaN(userLat) || isNaN(userLon)) {
		return res.status(400).json({ error: "Invalid latitude or longitude" });
	}
	try {
		//retrive data from school using select query
		const [school] = await pool.execute("SELECT *FROM school");
		//ues map mathod to find the distance
		const withDistance = school.map((school) => {
			const distance = Math.sqrt(
				Math.pow(userLat - school.latitude, 2) +
					Math.pow(userLon - school.longitude, 2),
			);
			return { ...school, distance };
		});
		//sort data based on distance
		withDistance.sort((a, b) => a.distance - b.distance);

		res.json(withDistance);
	} catch (err) {
		res.json({ error: "Error in getting data..." });
	}
});
app.listen(3000, () => {
	console.log("Server is running on port 3000....");
});
