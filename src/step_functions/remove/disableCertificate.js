"use strict";

const {getService, CLIENT_VERSIONS} = require('../../common/awsSdk');

const iot = getService({
    service: require('aws-sdk/clients/iot'),
    apiVersion: CLIENT_VERSIONS.iot
});

const INACTIVE_STATUS = "INACTIVE"; //See aws core type CertificateStatus

module.exports = {
    /**
     * Disables certificate from an IOT thing
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
    disableCertificate: function (input, context, cb) {
        if (!input || !input.certificateId) {
            cb("Event body needs to have field 'certificateId'", input);
        }

        let params = {
            certificateId: input.certificateId,
            newStatus: INACTIVE_STATUS
        };

        iot.updateCertificate(params, function (err) {
            cb(err, input);
        });
    }
};
