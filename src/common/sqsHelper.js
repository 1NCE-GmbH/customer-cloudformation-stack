"use strict";

const {getService, CLIENT_VERSIONS} = require('../common/awsSdk');

class SqsHelper {
    constructor() {
        this.sqs = getService({
            service: require('aws-sdk/clients/sqs'),
            apiVersion: CLIENT_VERSIONS.sqs
        });
    }

    /**
     * process array of objects and post individual messages into SQS
     * @param url SQS url to post to
     * @param messages array of objects
     * @param errHook optional function to call when individual message procession fails
     * @param okHook optional function to call when individual message procession succeeds
     * @param validator optional validator function
     * @returns {Promise<[]>} array of errors (empty if no errors)
     */
    async postMessages(url, messages, errHook, okHook, validator) {
        let errors = [];
        await Promise.all(
            messages.map(async message => {
                try {
                    if (validator) {
                        // will throw exception if invalid
                        await validator(message);
                    }
                    await this.sqs
                        .sendMessage({
                            MessageBody: JSON.stringify(message),
                            QueueUrl: url
                        })
                        .promise();
                    console.log(`SqsHelper.postMessages: done `, message);
                    if (okHook) {
                        await okHook(message);
                    }
                } catch (e) {
                    console.error(
                        `SqsHelper.postMessages: error while creating sqs ${url} message ${message}`,
                        e
                    );
                    message.error = e.message;
                    errors.push({
                        message
                    });
                    if (errHook && !message._skip) {
                        await errHook(message);
                    }
                }
            })
        );
        return errors;
    }

    async deleteMessage(url, handle) {
        let params = {
            QueueUrl: url,
            ReceiptHandle: handle
        };
        await this.sqs.deleteMessage(params).promise();
    }
}

module.exports = new SqsHelper();
