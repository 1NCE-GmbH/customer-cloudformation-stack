"use strict";

const {getService, CLIENT_VERSIONS} = require('../../common/awsSdk');

const iot = getService({
    service: require('aws-sdk/clients/iot'),
    apiVersion: CLIENT_VERSIONS.iot
});

module.exports = {
    /**
     * Creates a thing (IOT Device)
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
    createThing: function (input, context, cb) {
        if (!input || !input.iccid || !input.ipAddress) {
            cb("Event body needs to have the fields 'ICCID' and 'ipAddress'.", input);
        }
        let now = new Date;
        let utc_timestamp = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
            now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());

        let params = {
            thingName: input.iccid,
            attributePayload: {
                attributes: {
                    created: utc_timestamp.toString()
                }
            }
        };
        iot.createThing(params, function (err, data) {
            if (err) {
                cb(err, input);
            } else {
                console.log(`Successfully created thing with ${data.thingName}`);
                cb(null, input);
            }
        });
    }
};
