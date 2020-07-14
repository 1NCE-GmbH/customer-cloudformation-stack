"use strict";

const {getService, CLIENT_VERSIONS} = require('../common/awsSdk');

const stepFunctions = getService({
    service: require('aws-sdk/clients/stepfunctions'),
    apiVersion: CLIENT_VERSIONS.stepfunctions
});


module.exports = {
    /**
     * Starts execution of step function to remove a thing
     *
     * @param event Step function event, should have body like:
     {
        "Records": [
          {
            "ICCID": ICCID,
            "uuid": uuid
          }, ..
        ]
      }
     * @param context Step function Context
     * @param cb Callback
     */
    removeThing: function (event, context, cb) {
        if (!event || !event.Records || event.Records.length < 1) {
            cb("Remove thing event needs to have at least one record.", event);
        }
        event.Records.forEach(record => {
            let params = {
                stateMachineArn: process.env.STATE_MACHINE_ARN,
                input: record.body
            };
            stepFunctions.startExecution(params, function (err) {
                cb(err, record);
            });
        });
    }
};
