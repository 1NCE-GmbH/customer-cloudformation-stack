"use strict";

const {getService, CLIENT_VERSIONS} = require('../../common/awsSdk');

const iot = getService({
    service: require('aws-sdk/clients/iot'),
    apiVersion: CLIENT_VERSIONS.iot
});

const s3 = getService({
    service: require('aws-sdk/clients/s3'),
    apiVersion: CLIENT_VERSIONS.s3
});
module.exports = {
    /**
     * Creates a certificate
     *
     * @param input Step function input, should have body like:
     {
        "iccid": ICCID,
        "ipAddress": ipAddress,
        "iotCoreEndpoint": "iotCoreEndpoint"
      }
     * @param context Step function Context
     * @param cb Callback
     */
    // TODO: Separate creation of certificate from storing in S3
    createKeysAndCert: function (input, context, cb) {
        iot.createKeysAndCertificate({setAsActive: true}, function (err, data) {
            if (err) {
                cb(err, input);
            } else {
                // write to S3
                let bucketName = process.env.S3_BUCKET;
                let s3_params = {
                    Body: JSON.stringify(data, null, 4),
                    Bucket: bucketName,
                    Key: data.certificateId
                };
                s3.putObject(s3_params, function (err) {
                    if (err) {
                        cb(err, input);
                    } else {
                        let output = Object.assign({},
                            input,
                            {
                                certificateId: data.certificateId,
                                certificateArn: data.certificateArn
                            });
                        cb(null, output);
                    }
                });
            }
        });
    }
};
