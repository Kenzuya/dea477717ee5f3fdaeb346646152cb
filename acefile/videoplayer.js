const { default: fetch } = require("node-fetch");
const cheerio = require("cheerio");
const vm = require("vm");
const { default: axios } = require("axios");
const UserAgent = require("user-agents");
async function AceFileVideoPlayer(url) {
    const html = await (await fetch(url)).text();
    const $ = cheerio.load(html);
    const script = $("body > script:nth-child(3)").text().replace("eval", "scriptResults = ");
    const context = {
        scriptResults: "",
    };
    vm.createContext(context);
    new vm.Script(script).runInContext(context);
    const encodedURL = context.scriptResults
        .substring(3000)
        .split("var check=")[1]
        .split(";")[0]
        .split('"')
        .map((val) => {
            if (val === "atob(") return;
            if (val === ")+atob(") return;
            if (val === ")") return;
            return val;
        })
        .join()
        .replaceAll(",", "");
    const decodedURL = atob(encodedURL);
    const urls = new URL(decodedURL);
    const userAgent = new UserAgent().data.userAgent;
    const { data: json } = await axios({
        url: decodedURL,
        method: "GET",
        headers: {
            "User-Agent": userAgent,
        },
    });
    const params = new URLSearchParams({
        alt: "media",
        key: urls.searchParams.get("key"),
    }).toString();
    const results = { ...json, direct_link: `${urls.origin + urls.pathname}?${params}` };
    return results;
}
module.exports = AceFileVideoPlayer;
// vidplayer("https://acefile.co/player/79364588");
