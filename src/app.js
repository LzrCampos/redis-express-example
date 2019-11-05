const redis = require('redis');
const axios = require('axios');
const express = require('express');

const redis_port = process.env.REDIS_PORT || 6379;
const port = process.env.PORT || 5000;

const redis_client = redis.createClient(redis_port);

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

findByName = (users, name) => {
	function checkName(user) {
		return user.firstName == name;
	}
	return users.find(checkName);
};

checkCache = (req, res, next) => {
	const { name } = req.params;

	redis_client.get(name, (err, data) => {
		if (err) {
			console.log(err);
			res.status(500).send(err);
		}
		//if no match found
		if (data != null) {
			res.send(data);
		} else {
			//proceed to next middleware function
			next();
		}
	});
};

app.get('/api/user/:name', checkCache, async (req, res) => {
	const { name } = req.params;

	try {
		const { data } = await axios.get(
			'https://lzrtestapi.azurewebsites.net/api/user'
		);

		const userName = findByName(data, name);

		if (userName) {
			redis_client.setex(name, 3600, JSON.stringify(userName));
			res.json(userName);
		} else {
			res.status(404).json({ user: 'User not found!' });
		}
	} catch (error) {
		res.status(500).json(error);
	}
});

app.listen(port, () => console.log(`Server is running on pot: ${port}`));
