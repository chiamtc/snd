import _ from 'lodash'
import request from 'request';
import moment from 'moment';
import axios from 'axios';
import cheerio from 'cheerio'
import fs from 'fs';
import path from 'path';

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
    console.log(begin, end)
    if (begin >= 0 && end >= 0) {
        const jsonStr = bodyStr.substring(begin, end + 2);
        let arr = JSON.parse(jsonStr);
        arr = _.filter(arr, item => item.format === 'mp4');
        arr = _.orderBy(arr, 'quality', 'desc');
        if (arr.length > 0) {
            info = arr[arr.length - 1];
            info.title = findTitle(bodyStr);
        }
    }
    return info;
};


const findTitle = (bodyStr) => {
    const $ = cheerio.load(bodyStr);
    const title = $('.inlineFree').text();
    const arr = title.split(' ');
    arr.pop();

    return arr.join('-');
};
findDownloadInfo('https://www.pornhub.com/view_video.php?viewkey=ph5a78e04e2e5d0').then((res) => {
    console.log('res', res)

    const pm = new Promise((resolve, reject) => {
        const fileName = `${moment().format('YYYYMMDD')}_${res.title}_${res.quality}.${res.format}`

        const dst = path.join(__dirname, fileName);
        const opts = {url: res.videoUrl};
        Object.assign(opts, baseReqOpts);
        return request.get(opts)
            .on('response', async resp => {
                const resHeaders = resp.headers;
                const ctLength = resHeaders['content-length'];
                const copyOpts = _.cloneDeep(opts);
                copyOpts.headers['Range'] = `bytes=0-${ctLength - 1}`;
                copyOpts.headers['Connection'] = 'keep-alive';
                console.log('ctLEngth',ctLength)
                let len = 0;
                const rgs = [];
                const maxChunkLen = 20*1024*1024;
                const num = parseInt(ctLength / maxChunkLen);
                const mod = parseInt(ctLength % maxChunkLen);
                for (let i = 0; i < num; i++) {
                    const rg = {
                        start: i === 0 ? i : i * maxChunkLen + 1,
                        end: (i + 1) * maxChunkLen
                    };
                    rgs.push(rg);
                }

                if (mod > 0) {
                    const rg = {
                        start: num * maxChunkLen + 1,
                        end: ctLength
                    };
                    rgs.push(rg);
                }
                rgs[rgs.length - 1].end = rgs[rgs.length - 1].end - 1;
                console.log(rgs)
                /*return request.get(copyOpts)
                    .on('error', err => {
                        return reject(err);
                    })
                    .on('response', resp => {
                        const ws = fs.createWriteStream(dst, {encoding: 'binary'});
                        resp.on('error', err => {
                            return reject(err);
                        });
                        resp.on('data', chunk => {
                            ws.write(chunk);
                            len += chunk.length;
                            //  bar.showPer(len / ctLength);
                        });
                        resp.on('end', () => {
                            ws.end();
                            console.log();
                            return resolve(`downloaded!`);
                        });
                    });*/
            })
    });
});
/*const arr = [
    {
        defaultQuality: false,
        format: 'upsell',
        quality: '1080',
        videoUrl: ''
    },
    {
        defaultQuality: false,
        format: 'mp4',
        quality: '720',
        videoUrl: 'https://cv.phncdn.com/videos/201802/05/153474752/720P_1500K_153474752.mp4?f8nZ37a2oOKjln1WcHXWokDiqxOeNdluZl4X1SwGhE192q8IvEGXoyQThFi7jwNQqTPEldKjWqtlm4gy_Gf67ETI7UOg_4bO81weDrRtF2hdsZ97eFjGtI2f6K7qpGAueX3ko-_42ztGnECtLZHd7JfBm8vxWOd0R_fxptB3YA2mM8cowFL-9hyc-2ewOrly2mlDatUmW1s'
    },
    {
        defaultQuality: false,
        format: 'mp4',
        quality: '480',
        videoUrl: 'https://cv.phncdn.com/videos/201802/05/153474752/480P_600K_153474752.mp4?xuR2MagPx0oKvEx9wXmZfQPai3uQG0-EXjD3ydhlDjj3ZvPfJw9x_pd7rq3IWkVsn0jscE1CYlWpkkqdqsW6oYoQpXfF3ytYibTBG4BxNvDHpqt7sZMtpIHduU5fQYqDypqYxqHm1AvY0gHL7X-r-89ABwLFZ83AUPmT2ApF1-Y9uGg80KvwTmRFbWcrFCj-AMUUEB9v'
    },
    {
        defaultQuality: false,
        format: 'mp4',
        quality: '240',
        videoUrl: 'https://cv.phncdn.com/videos/201802/05/153474752/240P_400K_153474752.mp4?ZhjNdA2-i_8yitgIM46p06pUxfbLHLzUGcj20jmyo7l4f4GjnOyn6ImcHQOaD8rF5c36rtPp_LS-qHDUfChyZ26vibnHBrCbcVcL-Hc4UeVcVWpcOD5r3giIpEHbx3N_KAXgo0SK0bER_ZOw7TYyap6bUaC-lK4GW0o1Sn57mDy69z_e6y6yGIKLwXGWirhxV1C2YgtOcw'
    },
    {
        defaultQuality: true,
        format: 'hls',
        videoUrl: 'https://cvc.phncdn.com/hls/videos/201802/05/153474752/,720P_1500K,480P_600K,240P_400K,_153474752.mp4.urlset/master.m3u8?UFazXVORKYu8xgsnae08BSnIjqDvB4aSuF2Fv2_V3Fh-qAmDb2FntMs7iOmdS1DbCyojP99IlOcDy6Ye1Xvpz9SYfdVKNUiy2n5rIITi6wQ6MVxfHPzmeWuA9rWJta4RpgUzE8TEFPCtHyhKm3prmj-6gxXUz23jTQCG7MObkL2x06S05Q',
        quality: [720, 480, 240]
    },
    {
        defaultQuality: false,
        format: 'hls',
        videoUrl:
            'https://cvc.phncdn.com/hls/videos/201802/05/153474752/720P_1500K_153474752.mp4/master.m3u8?qV6Oa4HUnWKTusrnQEPQ84Cfdy-4FgBwQLHVnJ2aOfxOSOuJzoj_0ujuNUYMDo1flws3Gte_WaKJHe0EXxsWs5tkSoCEoU4LGWKVsJRqtLFFeWJFVDvkRQ5qXqoWM6BqbUyFkNislnrDtMBUK2I_UB8wS_9vmHuPN5kW_cGe8UGNSKg6Kg',
        quality: '720p'
    },
    {
        defaultQuality: false,
        format: 'hls',
        videoUrl: 'https://cvc.phncdn.com/hls/videos/201802/05/153474752/480P_600K_153474752.mp4/master.m3u8?QSVPa1M4gRnqO1Fw2Qi-qCz251rHoCHAVL1rg1vxKdwdNgYooOW113dpbK14NxB_ocviZSpU7Om3P9crkA_8fx-L6lQQroRRbDdxJVPvpx1sWVpdjAimY7CmujlP1ePjGm8QWxITf-64mDA67GKUGcMz_almy1DOEAQ3H83w36eqZOBEGQ',
        quality: '480p'
    },
    {
        defaultQuality: false,
        format: 'hls',
        videoUrl: 'https://cvc.phncdn.com/hls/videos/201802/05/153474752/240P_400K_153474752.mp4/master.m3u8?xKb7znBGhTZ3r9Z-wX3ujPpJmYi5ws4_YGrkD5-GMmNje-dZrMIJzzhy7wHpbBFJvQOIx_39bn1521ZI5WavLWy0VUqV6vLOEbrd0ZJyF00ZnOgVA0OVSKWZaiREZeO8VHUVoZalJg4Be-ZidbQvYLxNdKCPc0nhdl6lMCB0QmEgiF8qOg',
        quality: '240p'
    }];
const fil = _.filter(arr, (o) => o.format === 'mp4');
console.log('fil', fil)*/
/*

xvid:
1. body tag > div id="main" > div id="content" > div id="video-player-bg" > 4th script tag and voila
2. search "mozaique"

yp:
1. same as ph method. find "mediaDefinitions", replace \u0026 with & in the link

rt:
1. same as ph method, find "mediaDefinitions"*/
