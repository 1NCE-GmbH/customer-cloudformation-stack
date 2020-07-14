"use strict";

const {getService, CLIENT_VERSIONS} = require('../../common/awsSdk');

const iot = getService({
    service: require('aws-sdk/clients/iot'),
    apiVersion: CLIENT_VERSIONS.iot
});

module.exports = {
    /**
     * Deletes the certificate from the IOT Core
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
    deleteCertificate: function (input, context, cb) {
        if (!input || !input.certificateId) {
            cb("Delete certificate input needs to have the field 'certificateId'.", input);
        }

        let params = {certificateId: input.certificateId, forceDelete: true};
        iot.deleteCertificate(params, function (err) {
            cb(err, input);
        });
    }
};
