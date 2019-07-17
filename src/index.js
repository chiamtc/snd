import _ from 'lodash'
import request from 'request';
import axios from 'axios';
import cheerio from 'cheerio'

const baseUrl = 'https://www.pornhub.com';
const hds = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
};
const baseReqOpts = {
    headers: hds
};

const findDownloadInfo = (key) => {
    let finalKey = key;
    const pm = new Promise((resolve, reject) => {
        let pageUrl = `https://www.pornhub.com/view_video.php?viewkey=${key}`;
        console.log(pageUrl)
        if (key.startsWith('http')) {
            pageUrl = key;
            finalKey = key.split('=').pop();
        }
        let opts = {
            url: pageUrl
        };
        Object.assign(opts, baseReqOpts);
       console.log(opts)
         request(opts, (err, res, body) => {
            if (err) {
                return reject(err);
            }
            const ditem = parseDownloadInfo(body);
            if (ditem) {
                ditem.key = finalKey;
            }
            return resolve(ditem);
        });
    });

    return pm;
};

const parseDownloadInfo = (bodyStr) => {
    let info;
    const idx = bodyStr.indexOf('mediaDefinitions');
    if (idx < 0) {
        return info;
    }
    //console.log(bodyStr[116926],bodyStr[116927])
    let begin, end;
    for (let i = idx; i < bodyStr.length; i++) {
        const tmpStr = bodyStr.substr(i, 2);
        if (tmpStr === '[{') {
            begin = i;
        }

        if (tmpStr === '}]') {
            end = i;
            break;
        }
    }
    console.log(begin,end)
    if (begin >= 0 && end >= 0) {
        const jsonStr = bodyStr.substring(begin, end + 2);
        console.log('jsonStr',jsonStr)
        let arr = JSON.parse(jsonStr);
        arr = _.filter(arr, item => {
            return item.videoUrl.length > 0;
        });
        arr = _.orderBy(arr, 'quality', 'desc');
        if (arr.length > 0) {
            info = arr[0];
            info.title = findTitle(bodyStr);
        }
    }
    return info;
};


const findTitle = (bodyStr) => {
    const $ = cheerio.load(bodyStr);
    const title = $('.inlineFree').text();
    console.log('title?',$('.inlineFree').text())
    const arr = title.split('-');
    arr.pop();

    return arr.join('-');
};
findDownloadInfo('https://www.pornhub.com/view_video.php?viewkey=ph5a78e04e2e5d0').then((res)=>{
    console.log('res',res)
});
