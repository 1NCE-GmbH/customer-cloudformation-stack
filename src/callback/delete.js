"use strict";
const {sendCustomerDeprovisionedCallback} = require("./callbackService");
const response = require('../common/cfnresponse');


/**
 * Callback to notify 1nce about a successful CloudFormation stack deployment.
 *
 * Performs the following steps
 * - Get the IoT Core Endpoint address
 * - Notify 1nce about successful CloudFormation stack deployment
 * - Performs a CloudFormation notify, to inform the service was successfully executed
 *
 * @param event CLoudFormation notification event
 * @param context Lambda context
 */
function callback(event, context) {
    const callbackUrl = !event.ResourceProperties.OverrideCallBackUrl ? event.ResourceProperties.CallbackUrl : event.ResourceProperties.OverrideCallBackUrl;

    console.log(`Request Type: ${event.RequestType}`);
    if (event.RequestType === "Create" || event.RequestType === "Update") {
        return response.send(event, context, response.SUCCESS);
    }
    sendCustomerDeprovisionedCallback(event, callbackUrl)
        .then(() => {
            console.log(`Successfully sent the Delete callback to 1NCE`);
            response.send(event, context, response.SUCCESS);
        })
        .catch((err) => {
            console.error('Error:', err);
            response.send(event, context, response.FAILED);
        });
}

module.exports = {
    callback
};
