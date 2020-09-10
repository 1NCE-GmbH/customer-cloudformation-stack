"use strict";
const response = require('../common/cfnresponse');
const {getIotCoreEndpoint} = require("../callback/create");


function handler(event, context) {
    if (event.RequestType === "Delete") {
        response.send(event, context, response.SUCCESS);
    }
    getIotCoreEndpoint().then((iotData) => {
        if (iotData.endpointAddress === undefined) {
            response.send(event, context, response.FAILED);
        }
        response.send(event, context, response.SUCCESS, {iotCoreEndpointAddress: iotData.endpointAddress});
    }).catch((err) => {
        console.error(err);
        response.send(event, context, response.FAILED);
    });
}

module.exports = {
    handler
};
