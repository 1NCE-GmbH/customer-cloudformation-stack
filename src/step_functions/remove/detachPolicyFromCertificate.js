"use strict";

const {getService, CLIENT_VERSIONS} = require('../../common/awsSdk');

const iot = getService({
    service: require('aws-sdk/clients/iot'),
    apiVersion: CLIENT_VERSIONS.iot
});

module.exports = {
    /**
     * Detaches a policy from certificate
     *
     * @param input Step function input, should have body like:
     {
        "ICCID": ICCID,
        "ipAddress": ipAddress,
        "iotCoreEndpoint": "iotCoreEndpoint"
        "certificateId": certificateId,
        "certificateArn": certificateArn,
        "policyName": policyName
      }
     * @param context Step function Context
     * @param cb Callback
     */
    detachPolicyFromCertificate: function (input, context, cb) {
        if (!input || !input.certificateArn) {
            cb("Detach policy input needs to have the field 'certificateArn'.", input);
        }

        let params = {policyName: process.env.THING_POLICY_NAME, target: input.certificateArn};
        iot.detachPolicy(params, function (err) {
            cb(err, input);
        });
    }
};
