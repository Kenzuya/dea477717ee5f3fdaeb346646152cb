const express = require("express");
const app = express();
const http = require("http");
const WebSocket = require("ws");
const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server });
const EasyDL = require("easydl");
const DriveraysMetadata = require("./driverays/Metadata");
const AceFileVideoPlayer = require("./videoplayer");
const acefile = require("./acefile");
const path = require("path");
const progress = require("progress-stream");
const fs = require("fs");
const status = {
    already_downloaded: 'File sudah di download',
    done : "Download sudah selesai, copying file",
    doneCopy: 'Copy data telah selesai...'
}
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
app.use(express.static('./public'))
wss.on("connection", async function (ws) {
    console.log("New Client Connected!");
    ws.on("message", async function (message) {
        try {
            if(!message.toString().includes('https://167.86.71.48/')) return ws.send('This is not Driverays link')
            const url = await DriveraysMetadata(message.toString());
            const link = await acefile(
                url.link_download[2]["1080p"].Googledrive ||
                    url.link_download[0]["720p"].Googledrive
            );
            const info = `
Judul film: ${url.title}
Tahun: ${url.year}
Skor: ${url.score}
Kualitas: ${url.quality}
Durasi: ${url.duration}
Sinopsis: ${url.synopsis}

Tunggu film akan segera didownload
 `;
 console.log(info);
            ws.send(info);
            if(fs.existsSync(`./${link.name}`)) {
                console.log(status.already_downloaded);
                ws.send(status.already_downloaded)
                return
            }
            const dl = new EasyDL(link.direct_link, `./${link.name}`, {
                connections: 20, 
                maxRetry: 5,
                reportInterval: 1000
            });
            dl.on("metadata", (data) => {
                const msg = `
Nama File: ${link.name}
Ukuran: ${bytesToSize(data.size)}
`;
console.log(msg);
ws.send(msg)
            });
            dl.on("progress", ({ total }) => {
                const data = `
Kecepatan: ${bytesToSize(total.speed)}, Downloaded: ${bytesToSize(
                    total.bytes
                )}, Presentase: ${formatAsPercent(total.percentage)}
`;
                console.log(data);
                ws.send(data);
            });
            dl.on('build', (progress) =>{
                const buildInfo = `Merging files... ${formatAsPercent(progress.percentage)} completed`
                console.log(buildInfo);
                ws.send(buildInfo)
            })
            // dl.destroy()
            await dl.wait();
            console.log(status.done);
            ws.send(status.done);
            var stat = fs.statSync(`./${link.name}`);
            var str = progress({
                length: stat.size,
                time: 100
            });
            str.on("progress", function (progress) {
                const progressCopy = `${formatAsPercent(progress.percentage)} completed`
                console.log(progressCopy);
                ws.send(progressCopy);
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
                            resolve()
                            const status = "Copy files completed!"
                            console.log(status);
                            ws.send(status);
                            cb && cb(err);
                            cbCalled = true;
                        }
                    }
                 })
            }
            const external_disk = fs.readdirSync('/srv').find((value) => value.includes('dev-disk'))
            await copyFile(path.resolve(`./${link.name}`), `/srv/${external_disk}/Media/Movies/${url.title} ${url.year}.mkv`)
            // await copyFile(path.resolve(`./${link.name}`), `./driverays/${url.title} ${url.year}.mkv`)
            const done = 'Copy data telah selesai...'
            console.log(done);
            ws.send(done)
            fs.unlinkSync(`./${link.name}`)
        } catch (err) {
            ws.send("Terjadi error!");
            console.log(err);
        }
    });
});
app.get("/", (req, res) => {
    const options = {
        root: path.join(__dirname, 'public'),
        dotfiles: 'deny',
        headers: {
          'x-timestamp': Date.now(),
          'x-sent': true
        }
      }
    res.sendFile('index.html', options)
});
server.listen(4000, () => console.log("Listening on port 4000"));
