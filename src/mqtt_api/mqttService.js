"use strict";
const AWS = require('aws-sdk');

const iotCoreEndpointAddress = process.env.iotCoreEndpointAddress;
const awsAccountId = process.env.awsAccountId;

const iotData = new AWS.IotData({endpoint: iotCoreEndpointAddress});


/**
 * Publishes MQTT messages to the IoT Core and modifies the topic name from:
 *      {awsId}/{iccid}/* --> {iccid}/*
 *
 * @param req HTTP Request body
 * @returns {Promise<{status: number}>}
 */
async function mqttToIoTCore(req) {

    await publishToIotCore(req.topic.replace(`${awsAccountId}/`, ""), req.payload, req.qos);
    return {
        status: 200
    };
}

/**
 * Publishes MQTT Messages to the IOT Core
 *
 * @param topic MQTT Topic
 * @param payload MQTT Message payload
 * @param qos MQTT QoS
 * @returns {Promise<void>}
 */
async function publishToIotCore(topic, payload, qos) {
    let params = {
        topic: topic,
        payload: payload,
        qos: qos
    };
    await iotData.publish(params).promise()
        .catch(err => {
            console.error(err);
        });
}

module.exports = {
    mqttToIoTCore
};