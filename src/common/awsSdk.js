'use strict';
const AWSXRay = require("aws-xray-sdk-core");

const CLIENT_VERSIONS = {
    dynamodb: '2012-08-10',
    s3: '2006-03-01',
    sqs: '2012-11-05',
    sns: '2012-11-05',
    stepfunctions: '2016-11-23',
    iot: '2015-05-28',
    apiGateway: '2015-07-09'
};

/**
 * Helper function to instantiate a new AWS service client such as SQS or DynamoDB.
 * The returned service instance is wrapped by XRay, except when running tests or running sls offline.
 * Requiring all possible service clients in this helper module and create some kind of factory
 * would be overkill as it would blow up the package size.
 * Therefor the function caller is responsible for passing the correct client service
 * That way, only dependencies that are really needed will be loaded.
 * With webpack this could be considered as we would be able to do tree-shaking and lose unused imports.
 *
 * @param service: AWS service client, such as "aws-sdk/clients/stepfunctions" or "aws-sdk/clients/sqs"
 * @param apiVersion: Service api version that needs to be used. Defaults to "latest", but highly recommended to pick any of the above (CLIENT_VERSIONS)
 * @param endpoint: Service endpoint when using a custom one (e.g. running local DynamoDB)
 * @param param: Any extra (service/use-case specific) parameters to instantiate the service with
 * @returns {Service}
 */
function getService({service, apiVersion = "latest", endpoint, params = {}}) {
    let clientConfig = Object.assign({},
        {
            apiVersion: apiVersion,
            endpoint: endpoint,
            region: process.env.AWS_REGION,
        },
        params);

    return process.env.JEST_WORKER_ID || process.env.IS_OFFLINE ? new service(clientConfig) : AWSXRay.captureAWSClient(new service(clientConfig));
}

module.exports = {
    CLIENT_VERSIONS,
    getService
};
