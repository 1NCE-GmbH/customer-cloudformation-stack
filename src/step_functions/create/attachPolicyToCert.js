"use strict";

const {getService, CLIENT_VERSIONS} = require('../../common/awsSdk');

const iot = getService({
    service: require('aws-sdk/clients/iot'),
    apiVersion: CLIENT_VERSIONS.iot
});

module.exports = {
    /**
     * Attaches the policy to a certificate
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
    attachPolicyToCert: function (input, context, cb) {
        if (!input || !input.certificateArn) {
            cb("Event body needs to have the field 'certificateArn'.", input);
        }
        let params = {policyName: process.env.THING_POLICY_NAME, target: input.certificateArn};
        iot.attachPolicy(params, function (err) {
            cb(err, input);
        });
    }
};
