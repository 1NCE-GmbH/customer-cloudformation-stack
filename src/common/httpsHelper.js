"use strict";

const https = require("https");
let url = require("url");

/**
 * Make a Post request to an endpoint
 *
 * @param post_url String with the path to the endpoint
 * @param data JSON data to send to the endpoint
 */
function httpsPost(post_url, data) {
    let parsedUrl = url.parse(post_url);
    let requestBody = JSON.stringify(data);

    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        headers: {
            "Content-Type": "application/json",
            "content-length": requestBody.length
        },
    };
    return new Promise((resolve, reject) => {
        let req = https.request({
            method: 'POST',
            ...options,
        }, res => {
            const chunks = [];
            res.on('data', data => chunks.push(data));
            res.on('end', () => {
                let body;
                if (chunks.length > 0) {
                    body = Buffer.concat(chunks);
                    if (res.headers['content-type'] === 'application/json') {
                        body = JSON.parse(body);
                    }
                }

                if (res.statusCode >= 400) {
                    console.error(res);
                    reject(res);
                } else {
                    resolve(body);
                }
            });
        }).on('error', err => {
                reject(err);
            }
        );
        req.write(requestBody);
        req.end();
    });
}

module.exports = {
    httpsPost
};
