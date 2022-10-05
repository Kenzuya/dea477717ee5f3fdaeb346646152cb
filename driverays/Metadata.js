const { default: fetch } = require('node-fetch');
const cheerio = require('cheerio');

async function DriveraysMetadata(url) {
    const html = await (await fetch(url)).text();
    const $ = cheerio.load(html);
    const title = $('#main-content > div.info_movie.relative.overflow-hidden.mb-5 > div.postdetail.sm\\:text-left.text-center.p-1.overflow-hidden > h1').html();
    const thumbnail = $('#main-content > div.tpost.mb-5 > div > img').attr('src');
    const image = $('#main-content > div.info_movie.relative.overflow-hidden.mb-5 > div.posthumb.sm\\:float-left.float-none.mx-auto.sm\\:mr-3.w-1\\/6 > img').attr('src');
    const score = $('#main-content > div.tpost.mb-5 > div > div.absolute.bottom-0.right-0.my-5.mx-8.z-10.sm\\:text-base.text\\:sm > span:nth-child(2)').html();
    const quality = $('#main-content > div.tpost.mb-5 > div > div.absolute.bottom-0.right-0.my-5.mx-8.z-10.sm\\:text-base.text\\:sm > span:nth-child(3)').text();
    const tagline = $('#main-content > div.info_movie.relative.overflow-hidden.mb-5 > div.postdetail.sm\\:text-left.text-center.p-1.overflow-hidden > span').html();
    const year = $(
        '#main-content > div.info_movie.relative.overflow-hidden.mb-5 > div.postdetail.sm\\:text-left.text-center.p-1.overflow-hidden > div.thn.flex.flex-wrap.sm\\:justify-start.justify-center.mt-2.text-sm > div:nth-child(1) > a'
    ).html();
    const duration = $(
        '#main-content > div.info_movie.relative.overflow-hidden.mb-5 > div.postdetail.sm\\:text-left.text-center.p-1.overflow-hidden > div.thn.flex.flex-wrap.sm\\:justify-start.justify-center.mt-2.text-sm > div:nth-child(3)'
    ).html();
    const director = $(
        '#main-content > div.info_movie.relative.overflow-hidden.mb-5 > div.postdetail.sm\\:text-left.text-center.p-1.overflow-hidden > div.info.text-sm.mt-3.border-t.border-dashed.pt-2.leading-6 > p:nth-child(1) > a'
    ).html();
    const rating = $(
        '#main-content > div.info_movie.relative.overflow-hidden.mb-5 > div.postdetail.sm\\:text-left.text-center.p-1.overflow-hidden > div.info.text-sm.mt-3.border-t.border-dashed.pt-2.leading-6 > p:nth-child(2)'
    )
        .text()
        .trim()
        .split(' ')[1];
    const genre = $(
        '#main-content > div.info_movie.relative.overflow-hidden.mb-5 > div.postdetail.sm\\:text-left.text-center.p-1.overflow-hidden > div.info.text-sm.mt-3.border-t.border-dashed.pt-2.leading-6 > p.mt-3'
    )
        .map((i, el) => {
            return $(el)
                .text()
                .split('\n')
                .filter((value) => {
                    if (value == '') return;
                    return value.trim();
                })
                .map((value) => {
                    return value.trim();
                });
        })
        .toArray();
    const synopsis = $('#tab-1 > p').text();
    const link_download = $('#dl_tab > div')
        .map((i, el) => {
            const object = {};
            $(`div.dl_links > a`, el).each((i, el) => {
                object[$(el).html()] = $(el).attr('href');
            });
            const json = {
                [$(`div.resol.bg-blue-500.px-2.py-1.rounded.text-center.text-white.mr-2`, el).text()]: object
            };
            return json;
        })
        .toArray();
    const json = {
        title,
        year,
        thumbnail,
        image,
        score,
        quality,
        tagline,
        duration,
        director,
        rating,
        genre,
        synopsis,
        link_download
    };
    // console.log(json.link_download);
    return json;
}
module.exports = DriveraysMetadata;
