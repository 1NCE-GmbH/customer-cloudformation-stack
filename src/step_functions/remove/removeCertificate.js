"use strict";

const {getService, CLIENT_VERSIONS} = require('../../common/awsSdk');

const s3 = getService({
    service: require('aws-sdk/clients/s3'),
    apiVersion: CLIENT_VERSIONS.s3
});

module.exports = {
    /**
     * Deletes the certificate from the S3 bucket
     *
     * @param input Step function input, should have body like:
     {
        "iccid": ICCID,
        "ipAddress": ipAddress,
        "iotCoreEndpoint": "iotCoreEndpoint"
        "certificateId": certificateId,
        "certificateArn": certificateArn,
        "policyName": policyName
      }
     * @param context Step function Context
     * @param cb Callback
     */
    deleteCertificateFromS3: function (input, context, cb) {
        if (!input || !input.certificateId) {
            cb("Remove certificate input needs to have the field 'certificateId'.", input);
        }

        let s3_params = {
            Key: input.certificateId,
            Bucket: process.env.S3_BUCKET
        };

        s3.deleteObject(s3_params, function (err) {
            cb(err, input);
        });
    }
};
