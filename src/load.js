const _ = require("lodash");
const path = require('path');
const moment = require('moment');
const request = require('request');
const fs = require('fs');
process.on('message', async(msg) => {
    console.log(msg)
    const hds = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
    };
    const baseReqOpts = {
        headers: hds
    };
    const fileName = `${moment().format('YYYYMMDD')}_${msg.res.title}_${msg.res.quality}.${msg.res.format}`

    const dst = path.join(__dirname, fileName);
    const opts = {url: msg.res.videoUrl};
    Object.assign(opts, baseReqOpts);
    const files = [];
    const copyOpts = _.cloneDeep(opts);
    copyOpts.headers['Range'] = `bytes=${msg.part.start}-${msg.part.end}`;
    copyOpts.headers['Connection'] = 'keep-alive';

    const file = path.join(__dirname, `${msg.res.key}_${msg.part.chunk}`);
    console.log('file',file)

    try {
        const oneFile = await (new Promise((resolve, reject) => {
            request.get(copyOpts)
                .on('error', err => {
                    reject(err);
                })
                .pipe(fs.createWriteStream(file, {encoding: 'binary'}))
                .on('close', () => {
                    resolve(`file${msg.part.chunk} has been downloaded!`);
                });
        }))
        process.send({chunk: msg.part.chunk});
    }catch(err){
        console.log('try catch err',err)
    }
    // console.log(oneFile);
});