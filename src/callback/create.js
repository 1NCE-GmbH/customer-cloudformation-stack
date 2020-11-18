"use strict";
const {sendCustomerProvisionedCallback} = require("./callbackService");
const response = require("../common/cfnresponse");
const {getService, CLIENT_VERSIONS} = require("../common/awsSdk");

const iot = getService({
    service: require("aws-sdk/clients/iot"),
    apiVersion: CLIENT_VERSIONS.iot
});

const apiGateway = getService({
    service: require("aws-sdk/clients/apigateway"),
    apiVersion: CLIENT_VERSIONS.apiGateway
});

const iotCoreEndpointType = "iot:Data-ATS";

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
    const callbackUrl = !event.ResourceProperties.OverrideCallBackUrl
        ? event.ResourceProperties.CallbackUrl
        : event.ResourceProperties.OverrideCallBackUrl;

    console.log(`Request Type: ${event.RequestType}`);
    if (event.RequestType === "Delete" || event.RequestType === "Update") {
        return response.send(event, context, response.SUCCESS);
    }
    console.log(`Callback URL: ${callbackUrl}`);

    let iotEndpointAddress;

    getIotCoreEndpoint()
        .then((iotData) => {
            if (iotData.endpointAddress === undefined || callbackUrl === undefined) {
                response.send(event, context, response.FAILED);
            }
            iotEndpointAddress = iotData.endpointAddress;

            return event.ResourceProperties["1nce"].IntegrationType === "FULL_INTEGRATION"
                ? getApiKey(event.ResourceProperties.Resources.ApiKeyId)
                : undefined;
        })
        .then((apiKeyData) => {
            if (event.ResourceProperties["1nce"].IntegrationType === "DATA_INTEGRATION") {
                return undefined;
            }

            if (apiKeyData.value === undefined) {
                response.send(event, context, response.FAILED);
            }
            return apiKeyData.value;
        })
        .then((apiKey) => {
            sendCustomerProvisionedCallback(event, callbackUrl, iotEndpointAddress, apiKey)
                .then(() => {
                    console.log(`Successfully sent the create callback to 1NCE`);
                    response.send(event, context, response.SUCCESS, {iotCoreEndpointAddress: iotEndpointAddress});
                })
                .catch((err) => {
                    console.error("Error:", err);
                    response.send(event, context, response.FAILED);
                });
        })
        .catch((err) => {
            console.error(err);
            response.send(event, context, response.FAILED);
        });
}

function getApiKey(apiKeyId) {
    const params = {
        apiKey: apiKeyId,
        includeValue: true
    };

    return apiGateway.getApiKey(params).promise();
}

function getIotCoreEndpoint() {
    const params = {
        endpointType: iotCoreEndpointType
    };
    return iot.describeEndpoint(params).promise();
}

module.exports = {
    callback,
    getIotCoreEndpoint
};
