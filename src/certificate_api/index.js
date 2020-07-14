'use strict';

const CertService = require('./certService');
const utils = require('../common/utils');

module.exports = {
    getCertificate: async event => await utils.processRequest(event, (event) => CertService.getCertificateFromBucket(event))
};
