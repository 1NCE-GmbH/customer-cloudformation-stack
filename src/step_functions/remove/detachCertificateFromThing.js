"use strict";

const {getService, CLIENT_VERSIONS} = require('../../common/awsSdk');

const iot = getService({
    service: require('aws-sdk/clients/iot'),
    apiVersion: CLIENT_VERSIONS.iot
});

module.exports = {
    /**
     * Detaches a certificate from a thing
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
    detachCertificateFromThing: function (input, context, cb) {
        if (!input || !input.certificateArn || !input.iccid) {
            cb("Detach certificate input needs to have the fields 'certificateArn' and 'ICCID'.", input);
        }

        let detachCertificateParams = {principal: input.certificateArn, thingName: input.iccid};
        iot.detachThingPrincipal(detachCertificateParams, function (err) {
            cb(err, input);
        });
    }
};
