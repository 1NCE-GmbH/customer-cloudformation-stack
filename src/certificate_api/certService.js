const AWS = require("aws-sdk/");

AWS.config.region = process.env.AWS_REGION;
const s3 = new AWS.S3();

/**
 * Pulls a certificate from the S3 bucket
 * @param req http request body JSON
 * @returns {string} with certificate if requested data is found, else it will send an error
 */
async function getCertificateFromBucket(req) {
    let bucketParams = {
        Bucket: process.env.S3_BUCKET,
        Key: req['pathParameters']['certKey']
    };

    let res = {
        status: 201
    };

    try {
        await s3.getObject(bucketParams, function (err, data) {
            if (data && data.Body) {
                let jsonBody = JSON.parse(data.Body);
                res.body = {
                    certificate: jsonBody.certificatePem,
                    privateKey: jsonBody.keyPair.PrivateKey
                };
                res.status = 200;
            }
        }).promise();
    } catch (err) {
        console.log(err);
        res.body = "This certificate does not exist";
        res.status = 404;
    }
    return res;
}

module.exports = {
    getCertificateFromBucket
};
