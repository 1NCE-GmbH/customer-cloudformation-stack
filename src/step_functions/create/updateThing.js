"use strict";

const {getService, CLIENT_VERSIONS} = require('../../common/awsSdk');

const iot = getService({
    service: require('aws-sdk/clients/iot'),
    apiVersion: CLIENT_VERSIONS.iot
});

module.exports = {
    /**
     * Updates a IoT Thing
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
    updateThing: function (input, context, cb) {
        if (!input || !input.iccid || !input.certificateId || !input.certificateArn) {
            cb("Event body needs to have the fields 'ICCID', 'certificateId', 'certificateArn'", input);
        }

        let iot_params = {
            thingName: input.iccid,
            attributePayload: {
                attributes: {
                    certificateArn: input.certificateArn,
                    certificateId: input.certificateId
                },
                merge: true
            }
        };

        iot.updateThing(iot_params, function (err) {
            cb(err, input);
        });
    }
};
