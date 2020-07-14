"use strict";
const httpsHelper = require("../common/httpsHelper");

const CALLBACK_MESSAGE_TYPES = {
    CUSTOMER_PROVISIONED: "customer-provisioned"
};
const CALLBACK_MESSAGE_BASE = {
    version: "V0.1",
    message_source: "cfn"
};

/**
 * Sends a successful CloudFormation stack  deployment notification to 1nce
 *
 * @param event CloudFormation notification event
 * @param callbackUrl URL used for doing a callback to 1nce
 * @param iotCoreEndpoint IoT Core Endpoint URL
 * @param apiKey API Key used for the endpoints in the stack
 * @param success Success callback method
 * @param error Error callback method
 */
function sendCustomerProvisionedCallback(event, callbackUrl, iotCoreEndpoint, apiKey, success, error) {
    let callbackMessage = createCallBackMessage(event, iotCoreEndpoint, apiKey, CALLBACK_MESSAGE_TYPES.CUSTOMER_PROVISIONED);
    console.log("Callback Message:\n", JSON.stringify(callbackMessage));
    return httpsHelper.httpsPost(callbackUrl, callbackMessage, success, error);
}

/**
 * Creates Callback Message
 *
 * @param event CloudFormation notification event
 * @param iotCoreEndpoint URL used for doing a callback to 1nce
 * @param apiKey API Key used for the endpoints in the stack
 * @param callbackState CallbackState, using the CALLBACK)MESSAGE_TYPES enum
 * @returns {{version: string, message_source: string} & {time_stamp: string, identifier_token: string, data: {resources: {deprovisioning: {arn, url}, provisioning: {arn, url}, links: {certificates}}, cloud_formation: {version: *, stack_name}, aws: {iot_core_endpoint, account_id: *, region}}, message_type: *}}
 */
function createCallBackMessage(event, iotCoreEndpoint, apiKey, callbackState) {
    let resourceProperties = event.ResourceProperties;
    let resources = resourceProperties.Resources;

    return Object.assign({},
        CALLBACK_MESSAGE_BASE,
        {
            time_stamp: new Date().toISOString(),
            message_type: callbackState,
            identifier_token: resourceProperties.IdentifierToken,
            data: {
                aws: {
                    account_id: resourceProperties.AWS.AccountId,
                    region: resourceProperties.AWS.Region,
                    iot_core_endpoint: iotCoreEndpoint,
                    lambda_iam_role: resourceProperties.AWS.LambdaExecutionIamRole,
                    state_machine_iam_role: resourceProperties.AWS.StateMachineExecutionIamRole
                },
                cloud_formation: {
                    version: resourceProperties.CloudFormationVersion,
                    stack_name: resourceProperties.StackName
                },
                resources: {
                    api_key: apiKey,
                    provisioning: {
                        arn: resources.Provisioning.Arn,
                        url: resources.Provisioning.Url
                    },
                    deprovisioning: {
                        arn: resources.Deprovisioning.Arn,
                        url: resources.Deprovisioning.Url
                    },
                    links: {
                        certificates: resources.Links.Certificates,
                        mqtt_endpoint: resources.Links.Mqtt
                    }
                }
            }
        }
    );
}

module.exports = {
    sendCustomerProvisionedCallback
}
