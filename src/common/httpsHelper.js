"use strict";

const https = require("https");
let url = require("url");

/**
 * Make a GET request to an API (endpoint response has to be JSON)
 * @param apiPath String with the path leading to the requested endpoint
 * @param pathParameter String containing pathparameter value (leave string empty if none)
 * @returns {Promise<[]>} String of response API call
 */
async function httpsAWSGet(apiPath, pathParameter) {
    return new Promise((resolve, reject) => {
        https
            .get(`https://${process.env.API_GATEWAY_ID}.execute-api.${process.env.AWS_REGION}.amazonaws.com/${process.env.API_STAGE}/${apiPath}/${pathParameter}`,
                resp => {
                    let output = "";

                    resp.on("data", chunk => {
                        output += chunk;
                    });
                    resp.on("end", () => {
                        try {
                            let obj = JSON.parse(output);
                            resolve(obj);
                        } catch (err) {
                            console.error("rest::end", err);
                            reject(err);
                        }
                    });

                    if (resp.statusCode >= 400) {
                        console.warn(output + resp.statusCode);
                        reject("Received " + resp.statusCode);
                    }
                })
            .on("error", err => {
                console.error("rest::request", err);
                reject(err);
            });
    });
}

/**
 * Make a Post request to an endpoint
 *
 * @param post_url String with the path to the endpoint
 * @param data JSON data to send to the endpoint
 * @param success Success callback
 * @param error Error callback
 */
function httpsPost(post_url, data, success, error) {
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
    const req = https.request({
        method: 'POST',
        ...options,
    }, res => {
        const chunks = [];
        res.on('data', data => chunks.push(data));
        res.on('end', () => {
            let body = Buffer.concat(chunks);
            if (res.headers['content-type'] === 'application/json') {
                body = JSON.parse(body)
            }
            if (res.statusCode >= 400) {
                console.error(res);
                if (error) {
                    error(res);
                }
            } else {
                if (success) {
                    success(body);
                }
            }
        });
    });
    req.on('error', err => {
            if (error) {
                error(err);
            }
        }
    );
    if (requestBody) {
        req.write(requestBody);
    }
    req.end();
}

module.exports = {
    httpsAWSGet,
    httpsPost
};
