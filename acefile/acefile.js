const { default: fetch } = require("node-fetch");
const vm = require("vm");
const cheerio = require("cheerio");
const AceFileVideoPlayer = require("./videoplayer");
async function acefile(url) {
    const response = await (await fetch(url)).text();
    const $ = cheerio.load(response);
    const videolink = $("body > div.container > div > textarea").text().trim().split('"')[1];
    const json = await AceFileVideoPlayer(videolink);
    return json
}
module.exports = acefile;
// acefile("https://acefile.co/f/79856048/the-witch-part-2-the-othere-2022-480p-webrip-x264-drays-mkv");
