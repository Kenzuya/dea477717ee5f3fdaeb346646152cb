const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
const { io } = require("socket.io-client");
const SERVER_URL = process.env.SERVER_URL || "http://localhost:4000";
const progress = require("progress-stream");
const EasyDL = require("easydl");
const fs = require("fs");
const { getDriveDirectLink, getDriveDirectLinkV2, USER_COOKIE } = require("../acefile/downloader");
const { uploadFiles, generatePublicURL, listFiles } = require("../drive-api/index");
const downloadLink = "https://drive.google.com/uc?export=download&id=";
if (!fs.existsSync("./downloads")) fs.mkdirSync("./downloads");
const socket = io(SERVER_URL, {
	path: "/ws"
});
function bytesToSize(bytes, decimals = 2) {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
function formatAsPercent(num) {
	return new Intl.NumberFormat("default", {
		style: "percent",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(num / 100);
}
function percentage(partialValue, totalValue) {
	return (100 * partialValue) / totalValue;
}
socket.on("connect", () => {
	// console.log(socket.connected); // true
	const role = {
		client_role: "downloader"
	};
	console.log("Connected, Registering role as downloader...");
	socket.emit("register_client", role);
});
// socket.connect();
socket.on("home_get_links", (data) => {
	console.log(data);
});
socket.on("download", async (data) => {
	console.log("Triggered download...");
	// console.log(data);
	const HandleProgress = (progress) => {
		const percent = formatAsPercent(percentage(progress.bytesRead, progress.size));
		const response = `Uploading to Google Drive... ${percent}`;
		console.log(response);
		socket.emit("progress", { id: "upload", level: "success", message: response });
	};
	const { url } = await getDriveDirectLink(data.acefile.id);
	// console.log(url);
	// const url = data.direct_url;
	const filename = `${data.title} (${data.year}) ${data.quality}.mkv`;
	const fileDirectory = path.resolve(process.cwd(), "downloads", filename);
	const map = new Map([["fileSize", undefined]]);
	await HandleListFiles();
	async function HandleListFiles() {
		await listFiles(async (results) => {
			if (results) {
				// console.log(results);
				const metadata = results.find((data) => data.name.includes(filename));
				// console.log(metadata);
				if (metadata) {
					// const { url } = getDriveDirectLink(metadata.id);
					// isFilePresentOnDrive = true;
					console.log("File in drive is available");
					// map.set('isFilePresentOnDrive', true);
					socket.emit("home_download", metadata);
				} else {
					console.log("File in drive is not available");
					// isFilePresentOnDownloads = true;
					// map.set('isFilePresentOnDownloads', true);
					if (fs.existsSync(fileDirectory)) {
						console.log("Uploading to Google Drive...");
						const response = await uploadFiles(fileDirectory, filename.split(".")[0], HandleProgress);
						socket.emit("home_download", response);
					} else {
						console.log("Downloading & Uploading to Google Drive...");
						await DownloadFilm(url);
						// const response = await uploadFiles(fileDirectory, filename.split(".")[0], HandleProgress);
						// socket.emit("home_download", response);
					}
				}
			}
		});
	}
	// console.log(map);
	// console.log(map.get('isFilePresentOnDrive'));
	// console.log(map.get('isFilePresentOnDownloads'));
	// if (map.get('isFilePresentOnDrive')) return;
	// if (map.get('isFilePresentOnDownloads')) return;
	async function DownloadFilm(link, httpOptions) {
		if (!link) return socket.emit("notifications", { level: "error", message: "Direct Link is unavailable" });
		try {
			const dl = new EasyDL(link, fileDirectory, {
				reportInterval: 500,
				maxRetry: 4,
				connections: 20,
				followRedirect: true,
				httpOptions
			});
			dl.on("metadata", (data) => map.set("fileSize", data.size));
			dl.on("progress", ({ total }) => {
				const data = `
Mengunduh Film di Downloader... 
Percentage ${formatAsPercent(total.percentage)}         
Speed:   ${bytesToSize(total.speed)}      
Size: ${bytesToSize(map.get("fileSize"))}`;

				console.log(data);
				socket.emit("progress", { type: "success", message: data, id: "download" });
			});
			const isDownloaded = await dl.wait();
			if (isDownloaded) {
				const results = await uploadFiles(fileDirectory, `${data.title} (${data.year}) ${data.quality}`, HandleProgress);
				const exported = await generatePublicURL(results.id);
				const metadata = { ...results, ...exported };
				socket.emit("home_download", metadata);
			}
		} catch (err) {
			console.log(err);
			if (link.includes("googleapis")) {
				console.log('Link includes "googleapis" error');
				socket.emit("notifications", { level: "error", message: "Terjadi error ketika mendownload, mencoba lagi..." });
				const direct_link = await getDriveDirectLinkV2(downloadLink + data.acefile.id);
				DownloadFilm(direct_link, { method: "POST", headers: { cookie: USER_COOKIE } });
			} else if (link.includes("googleusercontent")) {
				console.log('Link includes "googleusercontent" error');
				socket.emit("notifications", { level: "error", message: "Terjadi error ketika mendownload, mencoba lagi..." });
				DownloadFilm(data.acefile.direct_link);
			} else {
				socket.emit("notifications", { level: "error", message: "Terjadi error ketika mendownload, download dibatalkan!" });
			}
		}
	}
	// await dl.wait();
});

socket.on("disconnect", () => {
	console.log("Disconnected from server...");
});

socket.on("connect_error", () => {
	console.log("Error connecting server");
});
