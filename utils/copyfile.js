var path = require('path');
var progress = require('progress-stream');
var fs = require('fs');
var _source = path.resolve('./kirbotz-md.zip');// 1.5GB
var _target= './driverays/kirbotz-md.zip';

var stat = fs.statSync(_source);
var str = progress({
    length: stat.size,
    time: 100
});

str.on('progress', function(progress) {
    console.log(progress.percentage);
});

function copyFile(source, target, cb) {
    var cbCalled = false;


    var rd = fs.createReadStream(source);
    rd.on("error", function(err) {
        done(err);
    });

    var wr = fs.createWriteStream(target);

    wr.on("error", function(err) {
        done(err);
    });

    wr.on("close", function(ex) {
        done();
    });

    rd.pipe(str).pipe(wr);

    function done(err) {
        if (!cbCalled) {
            console.log('done');
            cb && cb(err);
            cbCalled = true;
        }
    }
}
copyFile(_source,_target);