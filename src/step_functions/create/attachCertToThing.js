"use strict";

const {getService, CLIENT_VERSIONS} = require('../../common/awsSdk');

const iot = getService({
    service: require('aws-sdk/clients/iot'),
    apiVersion: CLIENT_VERSIONS.iot
});

module.exports = {
    /**
     * Attaches a certificate to a thing.
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
    attachCertToThing: function (input, context, cb) {
        if (!input || !input.iccid || !input.certificateArn) {
            cb("Event body needs to have the fields 'ICCID' and 'certificateArn'.", input);
        }
        let params = {
            principal: input.certificateArn,
            thingName: input.iccid
        };
        iot.attachThingPrincipal(params, function (err) {
            cb(err, input);
        });
    }
};
