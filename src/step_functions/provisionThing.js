"use strict";

const {getService, CLIENT_VERSIONS} = require('../common/awsSdk');

const stepFunctions = getService({
    service: require('aws-sdk/clients/stepfunctions'),
    apiVersion: CLIENT_VERSIONS.stepfunctions
});

module.exports = {
    /**
     * Starts execution of step function to provision a thing
     *
     * @param event Step function event, should have body like:
     {
  "Records": [
  {
    "ICCID": "ICCID"
  }, ..
  ]
}
     * @param context Step function Context
     * @param cb Callback
     */
    provisionThing: function (event, context, cb) {
        if (!event || !event.Records || event.Records.length < 1) {
            cb("Event body needs to have one or more records.", event);
        }
        event.Records.forEach(r => {
            let params = {
                stateMachineArn: process.env.STATE_MACHINE_ARN,
                input: r.body
            };
            stepFunctions.startExecution(params, function (err, data) {
                // TODO: this will not work with multiple records.
                // It would already return with the first callback.
                cb(err, data);
            });
        });
    }
};
