const { default: fetch } = require('node-fetch');
const cheerio = require('cheerio');
async function Driverays(url) {
    const html = await (await fetch(url)).text();
    const $ = cheerio.load(html);
    const json = $(`div.lg\\:grid.lg\\:grid-cols-5.lg\\:gap-5.flex.flex-wrap.overflow-y-auto > div`)
        .map((i, el) => {
            const title = $('a > div > div.title.absolute.bottom-0.p-2.py-4.w-full > h2', el).html();
            const quality = $('a > div > div.absolute.top-0.right-0 > span', el).html();
            const score = $('a > div > div.title.absolute.bottom-0.p-2.py-4.w-full > div > span.mr-2.bg-yellow-105.text-black-0.font-medium.px-2.inline-block.rounded.text-xs', el).html().trim();
            const year = $('a > div > div.title.absolute.bottom-0.p-2.py-4.w-full > div > span.text-xs.text-white.text-opacity-75', el).html().trim();
            const image = $('a > div > div.poster > img', el).attr('src');
            const link = $('a', el).attr('href');
            const object = {
                title,
                quality,
                score,
                year,
                image,
                link
            };
            return object;
        })
        .toArray();
    // console.log(json);
    const filtered = json.filter((data) => data.score !== 'NA');
    return filtered;
}
module.exports = Driverays;
// Driverays('https://167.86.71.48/?s=the+witch&post_type=post');
