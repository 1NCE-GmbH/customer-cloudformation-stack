'use strict';

const IPV4_PATTERN = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
const ICCID_PATTERN = /^\d{19}$/;
const IMSI_PATTERN = /^\d{15}$/;
const AMAZON_ROOTCA_URL = "https://www.amazontrust.com/repository/AmazonRootCA1.pem";

function isIPAddressValid(ipAddress) {
    return IPV4_PATTERN.test(ipAddress);
}

function isIccidValid(iccid) {
    return ICCID_PATTERN.test(iccid);
}

function isImsiValid(imsi) {
    return IMSI_PATTERN.test(imsi);
}

module.exports = {
    isIPAddressValid,
    isIccidValid,
    isImsiValid,
    AMAZON_ROOTCA_URL
};
