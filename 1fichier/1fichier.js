const cheerio = require("cheerio");
const { default: fetch } = require("node-fetch");
const FormData = require("form-data");
async function fichier_downloader(url) {
	const data = await (await fetch(url)).text();
	return new Promise(async (resolve, reject) => {
		const formdata = new FormData();
		const $ = cheerio.load(data);
		const filename = $("body > form > table > tbody > tr:nth-child(1) > td:nth-child(3)").text();
		const date = $("body > form > table > tbody > tr:nth-child(2) > td:nth-child(2)").text();
		const size = $("body > form > table > tbody > tr:nth-child(3) > td:nth-child(2)").text();
		const token = $("body > form > input[type=hidden]").val();
		formdata.append("adz", token);
		const data_post = await (
			await fetch(url, {
				method: "POST",
				body: formdata
			})
		).text();
		console.log(data_post);
		const json = {
			filename,
			date,
			size
			// token
		};
		//    console.log(token)
	});
}

fichier_downloader("https://1fichier.com/?leu5sdqc0hanaesui4t4");
