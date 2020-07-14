'use strict';

const mqttService = require("./mqttService");
const utils = require('../common/utils');

module.exports = {
    mqttToIoTCore: async event => await utils.processRequest(event, (event) => mqttService.mqttToIoTCore(event))
};
