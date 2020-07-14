'use strict';

const {getService, CLIENT_VERSIONS} = require('../common/awsSdk');

class DynamoHelper {
    constructor() {
        this.dynamoDb = getService({
            service: require('aws-sdk/clients/dynamodb'),
            apiVersion: CLIENT_VERSIONS.dynamodb
        });
    }

    /**
     * put entity into DynamoDB table without conditions. Throws error when failed
     * @param tableName name of the table
     * @param data JSON with data to put
     * @returns {Promise<void>}
     */
    async put(tableName, data) {
        let params = {
            TableName: tableName,
            Item: data
        };
        console.log(`DynamoHelper.put data to ${tableName}:`, data);
        await this.dynamoDb.put(params).promise();
    }

    /**
     * get single entry by index from sim status table
     * @param tableName DynamoDB table name
     * @param indexName String containing the name of the GSI or LSI used for querying
     * @param key String containing the name of the column on which the check will be done
     * @param keyValue String containing the value for which will be checked in the assigned column
     * @param descending Should the result set be sorted in descending order?
     * @param limit Maximum number of items to be retrieved
     * @returns {Promise<DocumentClient.AttributeMap>} Item if found or undefined if not found
     */
    async getByValue(tableName, indexName, key, keyValue, descending, limit) {
        let params = {
            TableName: tableName,
            IndexName: indexName,
            KeyConditionExpression: `${key} = :value`,
            ExpressionAttributeValues: {
                ":value": keyValue
            }
        };

        if (descending) {
            params.ScanIndexForward = false;
        }

        if (limit) {
            params.Limit = limit;
        }
        let body = await this.dynamoDb.query(params).promise();
        return body.Items;
    }

    /**
     * update a single entry in sim dynamoDB (error, if condition not satisfied)
     * @param tableName Dynamo table name
     * @param uuid primary key
     * @param data map object with columns to update
     * @param condition optional condition expression as string. If none, will check if uuid exists
     * @returns {Promise<DocumentClient.UpdateItemOutput & {$response: Response<DocumentClient.UpdateItemOutput, AWSError>}>}
     */
    async updateConditional(tableName, uuid, data, condition) {
        let params = {
            TableName: tableName,
            Key: {
                uuid: uuid
            },
            ConditionExpression: condition || 'attribute_exists(#uuid)',
            ExpressionAttributeNames: {"#uuid": "uuid"},
            ExpressionAttributeValues: {}
        };
        let updateExpression = 'SET ';
        let keys = Object.keys(data);
        for (let i = 0, len = keys.length; i < len; i++) {
            let key = keys[i];
            if (key === 'uuid') continue;
            let val = data[key];
            updateExpression += `#${key} = :${key}`;
            if (i < (len - 1)) {
                updateExpression += ', ';
            }
            params.ExpressionAttributeNames[`#${key}`] = key; // without setting these, could crash with 'reserved keyword'
            params.ExpressionAttributeValues[`:${key}`] = val;
        }
        params.UpdateExpression = updateExpression;
        console.log(`DynamoHelper.update data in ${tableName}:`, params);
        return await this.dynamoDb.update(params).promise();
    }
}

module.exports = new DynamoHelper();
