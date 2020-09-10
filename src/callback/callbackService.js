"use strict";
const httpsHelper = require("../common/httpsHelper");

const CALLBACK_MESSAGE_TYPES = {
    CUSTOMER_PROVISIONED: "customer-provisioned",
    CUSTOMER_DEPROVISIONED: "customer-deprovisioned"
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
 */
function sendCustomerProvisionedCallback(event, callbackUrl, iotCoreEndpoint, apiKey) {
    let callbackMessage = createCreateCallBackMessage(event);
    callbackMessage.data.aws.iot_core_endpoint = iotCoreEndpoint;
    callbackMessage.data.resources.api_key = apiKey;

    console.log("Create Callback Message:\n", JSON.stringify(callbackMessage));
    return httpsHelper.httpsPost(callbackUrl, callbackMessage);
}

function sendCustomerDeprovisionedCallback(event, callbackUrl) {
    let callbackMessage = createDeleteCallBackMessage(event);
    console.log("Delete Callback Message:\n", JSON.stringify(callbackMessage));
    return httpsHelper.httpsPost(callbackUrl, callbackMessage);
}

/**
 * Creates Create Callback Message
 *
 * @param event CloudFormation notification event
 * @returns {{version: string, message_source: string} & {time_stamp: string, identifier_token: string, data: {resources: {deprovisioning: {arn, url}, provisioning: {arn, url}, links: {certificates}}, cloud_formation: {version: *, stack_name}, aws: {iot_core_endpoint, account_id: *, region}}, message_type: *}}
 */
function createCreateCallBackMessage(event) {
    let resourceProperties = event.ResourceProperties;
    let resources = resourceProperties.Resources;

    return Object.assign({},
        createCallbackBaseMessage(event, CALLBACK_MESSAGE_TYPES.CUSTOMER_PROVISIONED),
        {
            data: {
                aws: {
                    account_id: resourceProperties.AWS.AccountId,
                    region: resourceProperties.AWS.Region,
                    lambda_iam_role: resourceProperties.AWS.LambdaExecutionIamRole,
                    state_machine_iam_role: resourceProperties.AWS.StateMachineExecutionIamRole
                },
                cloud_formation: {
                    version: resourceProperties.CloudFormationVersion,
                    stack_name: resourceProperties.StackName
                },
                resources: {
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

/**
 * Creates Delete Callback Message
 *
 * @param event CloudFormation notification event
 * @returns {{version: string, message_source: string} & {time_stamp: *, identifier_token: *, message_type: *} & {data: {cloud_formation: {version: *, stack_name: *}, aws: {account_id: *, region: *}}}}
 */
function createDeleteCallBackMessage(event) {
    let resourceProperties = event.ResourceProperties;
    return Object.assign({},
        createCallbackBaseMessage(event, CALLBACK_MESSAGE_TYPES.CUSTOMER_DEPROVISIONED),
        {
            data: {
                aws: {
                    account_id: resourceProperties.AWS.AccountId,
                    region: resourceProperties.AWS.Region
                },
                cloud_formation: {
                    version: resourceProperties.CloudFormationVersion,
                    stack_name: resourceProperties.StackName
                }
            }
        }
    );
}

function createCallbackBaseMessage(event, callbackState) {
    return Object.assign({},
        CALLBACK_MESSAGE_BASE,
        {
            time_stamp: new Date().toISOString(),
            message_type: callbackState,
            identifier_token: event.ResourceProperties.IdentifierToken
        })
}

module.exports = {
    sendCustomerProvisionedCallback,
    sendCustomerDeprovisionedCallback
}
