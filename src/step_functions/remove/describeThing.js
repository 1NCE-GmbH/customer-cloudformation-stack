"use strict";

const {getService, CLIENT_VERSIONS} = require('../../common/awsSdk');

const iot = getService({
    service: require('aws-sdk/clients/iot'),
    apiVersion: CLIENT_VERSIONS.iot
});

module.exports = {
    /**
     * Gets information about the specified thing
     *
     * @param input: Step function input, should have body like:
     {
       "ICCID": ICCID,
       "ipAddress": ipAddress
     }
     * @param context: Step function Context
     * @param cb: Callback
     */
    describeThing: function (input, context, cb) {
        if (!input || !input.iccid || !input.ipAddress) {
            cb("Describe thing input needs to have the fields 'ICCID' and 'ipAddress'.", input);
        }

        iot.describeThing({thingName: input.iccid}, function (err, data) {
            if (err) {
                cb(err, input);
            } else {
                let output = Object.assign({},
                    input,
                    {
                        thingName: data.thingName,
                        certificateId: data.attributes.certificateId,
                        certificateArn: data.attributes.certificateArn,
                        policyName: data.thingName
                    });

                cb(null, output);
            }
        });
    }
};
