"use strict";

const {getService, CLIENT_VERSIONS} = require('../../common/awsSdk');

const iot = getService({
    service: require('aws-sdk/clients/iot'),
    apiVersion: CLIENT_VERSIONS.iot
});

module.exports = {
    /**
     * Deletes a thing (device) from the IOT Core
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
    deleteThing: function (input, context, cb) {
        if (!input || !input.iccid) {
            cb("Delete thing input needs to have the field 'ICCID'.", input);
        }

        iot.deleteThing({thingName: input.iccid}, function (err) {
            cb(err, input);
        });
    }
};
