// @ts-check
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
const { io } = require("socket.io-client");
const DriveraysMetadata = require("../driverays/Metadata");
const url = process.env.SERVER_URL || "http://localhost:4000";
const acefile = require("../acefile/acefile");
const EasyDl = require("easydl");
const { getDriveDirectLink } = require("../acefile/downloader");
const fs = require("fs");
const progress = require("progress-stream");
const args = process.argv.slice(2);
const argsIncludes = (arguments) => args.find((data) => data.includes(arguments));
// console.log(url);
// const HDD_DIRECTORY = `/srv/${external_disk}/Media/Movies/${url.title} ${url.year}.mkv`
if (!fs.existsSync("./downloads")) fs.mkdirSync("./downloads");
const isDevMode = argsIncludes("dev");
isDevMode ? console.log("Starting Home Client with dev mode") : undefined;
/**
 * @param {string} filename
 */
function saveToHDDPath(filename) {
	if (isDevMode) {
		const directory = path.resolve(process.cwd(), "downloads");
		if (!fs.existsSync(directory)) fs.mkdirSync(directory);
		return path.resolve(process.cwd(), "downloads", filename);
	} else {
		const external_disk = fs.readdirSync("/srv").find((value) => value.includes("dev-disk"));
		// @ts-ignore
		return path.resolve("/srv", external_disk, "Media", "Movies", filename);
	}
}
// @ts-ignore
const socket = io(url, {
	path: "/ws"
});

// socket.connect();

// socket.on('home_get_links', async (data) => {
//     const metadata = await DriveraysMetadata(data);
//     // console.log(metadata);
//     const acefile_link = metadata.link_download[2]['1080p'].Googledrive;
//     const drive = await acefile(acefile_link);
//     // console.log(data);
//     metadata.direct_url = drive.direct_link;
//     metadata.fileId = drive.id;
//     // console.log(metadata);
//     socket.emit('download', metadata);
// });

function bytesToSize(bytes, decimals = 2) {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
/**
 * @param {number} num
 */
function formatAsPercent(num) {
	return new Intl.NumberFormat("default", {
		style: "percent",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(num / 100);
}

socket.on("connect", () => {
	const role = {
		client_role: "home"
	};
	console.log("Connected, Registering role as home...");
	socket.emit("register_client", role);
});

socket.on("home_get_download_link", async (data) => {
	try {
		console.log("Triggered home_get_download_link");
		// console.log(data);
		// const results = await acefile(data.link_download[2]['1080p'].Googledrive);
		const results = await acefile(data.link_download[0]["480p"].Googledrive);
		const response = { ...data, acefile: results };
		// console.log(response);
		if (data.mode === "user") {
			const { url } = await getDriveDirectLink(results.id);
			socket.emit("userSuccess", url);
		} else socket.emit("download", response);
	} catch (err) {
		socket.emit("notifications", { level: "error", message: "Terjadi Error yang tidak terduga" });
	}
});

socket.on("home_download_film", async (data) => {
	const filePath = saveToHDDPath(data.name);
	try {
		console.log("Triggered home_download_film");
		// console.log(data);
		let totalSize;
		// const url = data.webContentLink;
		const response = await getDriveDirectLink(data.id);
		// console.log(response);
		if (fs.existsSync(filePath)) {
			// const directory_file = saveToHDDPath(data.name);
			if (fs.existsSync(filePath)) {
				console.log("File sudah tersimpan di Media Server");
				socket.emit("notifications", { level: "success", message: "Download film di Home Client sudah selesai..." });
			} else {
				var stat = fs.statSync(filePath);
				var str = progress({
					length: stat.size,
					time: 100
				});
				str.on("progress", function (progress) {
					const progressCopy = `Copying files, ${formatAsPercent(progress.percentage)} completed`;
					console.log(progressCopy);
					// ws.send(progressCopy);
					socket.emit("progress", { id: "copy", message: progressCopy });
				});

				function copyFile(source, target, cb) {
					return new Promise((resolve, reject) => {
						var cbCalled = false;

						var rd = fs.createReadStream(source);
						rd.on("error", function (err) {
							done(err);
						});

						var wr = fs.createWriteStream(target);

						wr.on("error", function (err) {
							done(err);
						});

						wr.on("close", function (ex) {
							done();
						});

						rd.pipe(str).pipe(wr);

						function done(err) {
							if (!cbCalled) {
								resolve(undefined);
								const status = "Copy files completed!";
								console.log(status);
								socket.emit("notifications", { level: "success", message: status });
								cb && cb(err);
								cbCalled = true;
							}
						}
					});
				}
				console.log("File sudah tersimpan di Downloads");
				const hddPath = saveToHDDPath(data.name);
				await copyFile(filePath, hddPath);
				socket.emit("notifications", { level: "success", message: "Download film di Home Client sudah selesai..." });
			}
		} else {
			const dl = new EasyDl(response.url, filePath, {
				reportInterval: 500
			});
			dl.on("metadata", (data) => {
				totalSize = data.size;
			});
			dl.on("progress", ({ total }) => {
				const message = `
Mengunduh film di Home ...
Speed: ${bytesToSize(total.speed)}
Presentase: ${formatAsPercent(total.percentage)}
Size: ${bytesToSize(totalSize)}`;
				socket.emit("progress", { id: "download", message, level: "success" });
			});
			const isDownloaded = await dl.wait();
			const message = "Download film di Home Client sudah selesai...";
			if (isDownloaded) socket.emit("notifications", { level: "success", message });
		}
	} catch (err) {
		socket.emit("notifications", { level: "error", message: "Terjadi Error yang tidak terduga" });
	} finally {
		if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
	}
});

socket.on("connect_error", () => {
	// socket.auth.token = "abcd";
	console.log("Error connecting server...");
	// socket.connect();
});

socket.on("disconnect", () => {
	console.log("Disconnected from server...");
});
