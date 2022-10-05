require("dotenv").config();
const { Server } = require("socket.io");
const express = require("express");
const { createServer } = require("http");
const cors = require("cors");
const DriveraysSearch = require("./driverays/SearchPage");
const DriveraysMetadata = require("./driverays/Metadata");
const responseTime = require("response-time");
const db = require("./database/database.json");
const app = express();
app.use(cors());
app.use(responseTime());
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: "*"
	},
	path: "/ws"
});

app.get("/api/search", async (req, res) => {
	const { q } = req.query;
	console.log("Request API Search from: " + req.socket.remoteAddress);
	const reason = {
		status: undefined,
		statusCode: undefined,
		data: []
	};
	function handleNoResults() {
		reason.status = "No Data Results";
		reason.statusCode = 204;
		return res.json(reason).status(204);
	}
	if (!q) {
		reason.status = "Please Provide Query";
		reason.statusCode = 400;
		return res.json(reason).status(400);
	}
	if (q.includes("https://167.86.71.48")) {
		const results = await DriveraysMetadata(q);
		if (!results) handleNoResults();
		else {
			const modifiedData = {
				image: results.image,
				link: q,
				quality: results.quality,
				score: results.score,
				title: results.title,
				year: results.year
			};

			if (results.year && results.score && results.title) {
				reason.data = [modifiedData];
				reason.status = `Success`;
				reason.statusCode = 200;
			} else {
				reason.status = "No Data Results";
				reason.statusCode = 204;
			}
			// console.log(results);
			return res.json(reason);
		}
	} else {
		const results = await DriveraysSearch(q);
		if (results.length < 1) handleNoResults();
		else {
			reason.status = `Success`;
			reason.statusCode = 200;
			reason.data = results;
			return res.json(reason);
		}
	}
});

app.post("/api/login", (req, res) => {
	const encodedAuth = req.headers.authorization.split(" ")[1];
	const decodedAuth = atob(encodedAuth);
	const splitted = decodedAuth.split(":");
	const username = splitted[0];
	const password = splitted[1];
	if (username !== db.username) return res.json({ status: "Username Salah", statusCode: 401, token: null });
	else if (password !== db.password) return res.json({ status: "Password salah", statusCode: 401, token: null });
	else if (password !== db.password && username !== db.username) return res.json({ status: "Infomasi yang anda masukkan salah", statusCode: 401, token: null });
	else {
		return res.json({ status: "Success", statusCode: 200, token: db.token });
	}
	console.log(decodedAuth);
});

app.post("/api/verify", (req, res) => {
	const { token } = req.query;
	if (token !== db.token) return res.json({ statusCode: 401, isVerified: false });
	else if (token === db.token) return res.json({ statusCode: 200, isVerified: true });
});
const clientStatus = {
	home_client_is_connected: false,
	downloader_client_is_connected: false
};

const clientId = {
	home_client_id: null,
	downloader_client_id: null
};
io.on("connection", (socket) => {
	console.log("New client connected with id: " + socket.id);
	// console.log(io.sockets.adapter.rooms);
	// socket.emit('home_get_links', 'https://167.86.71.48/mulan-2020/');
	// socket.emit('home_get_links', 'https://167.86.71.48/downfall-the-case-against-boeing-2022/');
	socket.on("test", (message) => {
		console.log("Someone pinging me...");
		socket.emit("ping", "Hallo ngab");
	});
	// socket.on();
	// socket.on('download', (data) => {
	//     console.log(data);
	// });
	socket.on("register_client", (data) => {
		const role = data.client_role;
		if (role === "home") {
			clientStatus.home_client_is_connected = true;
			// map.set('home_client_id', socket.id);
			clientId.home_client_id = socket.id;
			console.log("Home Client is Connected...");
		}
		if (role === "downloader") {
			clientStatus.downloader_client_is_connected = true;
			// map.set('downloader_client_id', socket.id);
			clientId.downloader_client_id = socket.id;
			console.log("Downloader Client is Connected...");
		}
		socket.broadcast.emit("client_status", clientStatus);
	});
	socket.on("get_client_status", () => {
		socket.emit("client_status", clientStatus);
	});
	socket.on("get_metadata", async (data) => {
		console.log("Emitted get_metadata");
		let results = {};
		if (data.mode === "user") {
			results.mode = "user";
			console.log("Terminated");
			socket.emit("notifications", { level: "warning", message: "Maaf Untuk saat ini website belum dibuka secara public..." });
		} else if (data.mode === "admin") {
			// socket.emit("notifications", { level: "success", message: "Sedang Mengunduh film ...\nPresentase: 56%" });
			if (!clientStatus.home_client_is_connected) socket.emit("notifications", { level: "error", message: "Home client saat ini sedang tidak terhubung ke server" });
			else if (!clientStatus.downloader_client_is_connected) socket.emit("notifications", { level: "error", message: "Downloader client saat ini sedang tidak terhubung ke server" });
			else if (!clientStatus.home_client_is_connected && !clientStatus.downloader_client_is_connected)
				socket.emit("notifications", { level: "error", message: "Client sedang tidak terhubung ke server" });
			else {
				results = await DriveraysMetadata(data.link);
				if (results.duration.includes("/Eps")) return socket.emit("notifications", { level: "error", message: "Untuk Series saat ini belum support..." });
				results.mode = "admin";
				socket.broadcast.emit("home_get_download_link", results);
			}
		}
	});
	socket.on("get_download_link", (data) => {
		socket.emit("home_get_links", data);
	});
	// socket.on('home_got_download_link', (data) => {
	//     console.log(data);
	// });
	socket.on("download", (data) => {
		// console.log(data);
		socket.broadcast.emit("download", data);
		// socket.emit('rd_download', data);
	});
	socket.on("message", (data) => {
		console.log("emitted message event");
		socket.broadcast.emit("message", data);
	});
	socket.on("home_download", (data) => socket.broadcast.emit("home_download_film", data));
	socket.on("disconnect", () => {
		const keys = Object.keys(clientId).find((key) => clientId[key] === socket.id);
		if (keys === "downloader_client_id") {
			clientStatus.downloader_client_is_connected = false;
			clientId.downloader_client_id = null;
			console.log("Downloader Client is Disconnected...");
		}
		if (keys === "home_client_id") {
			clientStatus.home_client_is_connected = false;
			clientId.home_client_id = null;
			console.log("Home Client is Disconnected");
		}
		socket.broadcast.emit("client_status", clientStatus);
	});
	socket.on("notifications", (data) => socket.broadcast.emit("notifications", data));
	socket.on("progress", (data) => {
		console.log("emitted progress event");
		socket.broadcast.emit("progress", data);
	});
});
const port = process.env.PORT || 4000;
// io.listen(port);
httpServer.listen(port);
console.log("Server is listening on port: " + port);
