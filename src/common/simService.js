'use strict';

const dynHelper = require("./dynamoHelper");
const sqsHelper = require('./sqsHelper');
const uuid = require('uuid').v4;
const {AMAZON_ROOTCA_URL} = require('./constants');

const STATUS_TABLE = process.env.STATUS_TABLE;
const ICCID_KEY_NAME = "ICCID";
const IP_KEY_NAME = "Static_IP";

const SIM_ACTIVATION_QUEUE_NAME = `${process.env.SLS_STAGE}-activate-sim-sqs`;
const SIM_DEACTIVATION_QUEUE_NAME = `${process.env.SLS_STAGE}-deactivate-sim-sqs`;

const SIM_STATUSES = {
    ACTIVATE_INITIATED: "activate_initiated",
    ACTIVATE_SUCCESS: "activated",
    ACTIVATE_FAILED: "activate_failed",
    DEACTIVATE_INITIATED: "deactivate_initiated",
    DEACTIVATE_SUCCESS: "deactivated",
    DEACTIVATE_FAILED: "deactivate_failed"
};

const SIM_ERROR_STATUSES = {
    SEND_TO_CUSTOMER_FAILED: "send_to_customer_failed",
    RECEIVED_FAILURE_FROM_CUSTOMER: "received_failure_from_customer"
};

const DISALLOWED_STATUSES_FOR_NEW_ACTIVATION = [SIM_STATUSES.ACTIVATE_INITIATED, SIM_STATUSES.ACTIVATE_SUCCESS, SIM_STATUSES.DEACTIVATE_INITIATED];
const ALLOWED_STATUSES_FOR_DEACTIVATION = [SIM_STATUSES.ACTIVATE_SUCCESS];

/**
 * get sim by Static_IP. Sim should be in status activated
 * @param ip
 * @returns {sim} record from database
 */
async function getSimByIP(ip) {
    let sim = await getSimFromMetaStore(IP_KEY_NAME, ip);

    if (!sim || sim.status !== SIM_STATUSES.ACTIVATE_SUCCESS) {
        return null;
    }

    return sim;
}

/**
 * get sim by ICCID. Sim should be in status activated
 * @param iccid
 * @returns {sim} record from database
 */
async function getSimByICCID(iccid) {
    let sim = await getSimFromMetaStore(ICCID_KEY_NAME, iccid);

    if (!sim || sim.status !== SIM_STATUSES.ACTIVATE_SUCCESS) {
        return null;
    }

    return sim;
}

/**
 * Create new sim record in sim meta store. This will only succeed
 * if there is not already a sim with the same ICCID or Static_IP
 * and that is in a status that does not allow this sim to be created
 * @param sim: sim to be created
 * @param customerId
 * @param awsId
 * @returns {Promise<sim>}
 */
async function createSim(sim, customerId, awsId) {
    if (!sim || !sim.ICCID || !sim.Static_IP || !customerId || !awsId) {
        throw new Error("Sim, sim.ICCID, sim.Static_IP, customerId and awsId are mandatory for sim activation");
    }

    await checkIfSimAlreadyExists(sim.ICCID, sim.Static_IP);

    let now = new Date().getTime();
    let item = Object.assign({},
        sim,
        {
            uuid: uuid(),
            customer_id: customerId,
            aws_id: awsId,
            status: SIM_STATUSES.ACTIVATE_INITIATED,
            created: now,
            updated: now
        });

    try {
        await dynHelper.put(STATUS_TABLE, item);
        console.log(`Created sim [ICCID: ${sim.ICCID}, Static_IP: ${sim.Static_IP}] in ${STATUS_TABLE}`);
    } catch (error) {
        console.error(`Could not create sim [ICCID: ${sim.ICCID}, Static_IP: ${sim.Static_IP}] in ${STATUS_TABLE} with error ${error.message}`);
        throw error;
    }

    return item;
}

/**
 * @param sim: sim (should contain uuid from db) to be sent to customer's SQS Q
 * @param customRegion: optional custom region
 * @returns {Promise<{errors: []}>}
 */
async function activateSim(sim, customRegion) {
    console.log(`BssApiService.activateSim: ${sim.aws_id}`);
    let sqsName = getCustomerQueueName(sim.aws_id, SIM_ACTIVATION_QUEUE_NAME, customRegion || process.env.AWS_REGION);
    return await sqsHelper.postMessages(
        sqsName,
        [sim],
        async (evt) => {
            console.log(`failed SQS addition ${sqsName}`, evt);
            // update sim in dynamodb with error status
            await updateSimStatus(sim.uuid, SIM_STATUSES.ACTIVATE_FAILED, SIM_ERROR_STATUSES.SEND_TO_CUSTOMER_FAILED, evt);
        },
        null,
        null
    );
}

/**
 * @param sim (should contain uuid from db) to be sent to customer's SQS Q
 * @param awsId: awsId of sim to be deactivated
 * @param customRegion: optional custom region
 * @returns {Promise<{errors: []}>}
 */
async function deactivateSim(sim, awsId, customRegion) {
    if (!sim || !sim.ICCID || !sim.Static_IP || !awsId) {
        throw new Error("Sim, sim.ICCID, sim.Static_IP and awsId are mandatory for sim deactivation");
    }

    let simFromMetaStore = await getSimForDeactivation(sim.ICCID, sim.Static_IP, awsId);

    let sqsName = getCustomerQueueName(simFromMetaStore.aws_id, SIM_DEACTIVATION_QUEUE_NAME, customRegion || process.env.AWS_REGION);
    return await sqsHelper.postMessages(
        sqsName,
        [simFromMetaStore],
        async (evt) => {
            console.warn(`Failed SQS addition ${sqsName}`, evt);
            // update sim in dynamodb with error status
            await updateSimStatus(simFromMetaStore.uuid, SIM_STATUSES.DEACTIVATE_FAILED, SIM_ERROR_STATUSES.SEND_TO_CUSTOMER_FAILED, evt);
        },
        async (evt) => {
            console.log(`Sent sim to ${sqsName} for deactivation`, evt);
            await updateSimStatus(simFromMetaStore.uuid, SIM_STATUSES.DEACTIVATE_INITIATED);
        },
        null
    );
}

/**
 *
 * @param uuid
 * @param certificateId
 * @param iotCoreEndpoint
 * @param rootCaUrl
 * @param policyName
 * @returns {Promise<void>}
 */
async function finalizeActivation(uuid, certificateId, iotCoreEndpoint, rootCaUrl, policyName) {
    if (!uuid) {
        throw new Error('Cannot finalize activation without uuid');
    }

    if (!certificateId || typeof certificateId !== 'string') {
        throw new Error(`Cannot finalize activation [uuid: ${uuid}] without valid certificate id.`);
    }

    if (!iotCoreEndpoint) {
        throw new Error(`Missing iot core endpoint url. uuid = ${uuid}`);
    }

    let item = {
        uuid: uuid,
        status: SIM_STATUSES.ACTIVATE_SUCCESS,
        updated: new Date().getTime()
    };

    item.certificateId = certificateId;
    item.iotCoreEndpoint = iotCoreEndpoint;
    item.policyName = policyName;
    item.rootCaUrl = rootCaUrl || AMAZON_ROOTCA_URL;

    await dynHelper.updateConditional(STATUS_TABLE, uuid, item);
}

/**
 *
 * @param uuid
 * @param error
 * @returns {Promise<void>}
 */
async function failActivation(uuid, error) {
    if (!uuid) {
        throw new Error('Cannot fail activation without uuid');
    }

    await updateSimStatus(uuid, SIM_STATUSES.ACTIVATE_FAILED, SIM_ERROR_STATUSES.RECEIVED_FAILURE_FROM_CUSTOMER, error);
}

/**
 *
 * @param uuid
 * @returns {Promise<void>}
 */
async function finalizeDeactivation(uuid) {
    if (!uuid) {
        throw new Error('Cannot fail activation without uuid');
    }

    let item = {
        uuid: uuid,
        status: SIM_STATUSES.DEACTIVATE_SUCCESS,
        updated: new Date().getTime()
    };

    await dynHelper.updateConditional(STATUS_TABLE, uuid, item);
}

/**
 *
 * @param uuid
 * @param error
 * @returns {Promise<void>}
 */
async function failDeactivation(uuid, error) {
    if (!uuid) {
        throw new Error('Cannot fail deactivation without uuid');
    }

    await updateSimStatus(uuid, SIM_STATUSES.DEACTIVATE_FAILED, SIM_ERROR_STATUSES.RECEIVED_FAILURE_FROM_CUSTOMER, error);
}

/**
 * Update a sim with a new status
 * @param uuid: The sim's uuid to uniquely identify the sim record in the sim meta store
 * @param newStatus: new status (see SIM_STATUSES)
 * @param error: optional error field in case of setting error status
 * @param details: optional details in case of setting error status
 * @returns {Promise<ManagedUpload.SendData>|*|Promise<PromiseResult<D, E>>}
 */
async function updateSimStatus(uuid, newStatus, error, details) {
    let item = {
        uuid: uuid,
        status: newStatus,
        updated: new Date().getTime()
    };

    if (error) {
        item.error = error;
    }

    if (details) {
        item.details = details;
    }

    if (uuid) {
        return await dynHelper.updateConditional(STATUS_TABLE, uuid, item);
    }
}

/**
 * Check if sim already exists in the sim meta store.
 * A sim already exist if all of the following criteria apply:
 *  - sim can be found with either ICCID or Static_IP
 *  - the sim record is in a status that does not allow a new activation
 * If such a sim is found, an error will be thrown
 * @param ICCID
 * @param Static_IP
 */
async function checkIfSimAlreadyExists(ICCID, Static_IP) {
    let simFromMetaStore = await getSimFromMetaStore(ICCID_KEY_NAME, ICCID);
    if (simFromMetaStore && ((simFromMetaStore.status && DISALLOWED_STATUSES_FOR_NEW_ACTIVATION.indexOf(simFromMetaStore.status) >= 0) || !simFromMetaStore.status)) {
        throw new Error(`Sim [ICCID: ${ICCID}] already exist in ${STATUS_TABLE} with a conflicting status.`);
    } else {
        simFromMetaStore = await getSimFromMetaStore(IP_KEY_NAME, Static_IP);
        if (simFromMetaStore && ((simFromMetaStore.status && DISALLOWED_STATUSES_FOR_NEW_ACTIVATION.indexOf(simFromMetaStore.status) >= 0) || !simFromMetaStore.status)) {
            throw new Error(`Sim [Static_IP: ${Static_IP}] already exist in ${STATUS_TABLE} with a conflicting status.`);
        }
    }
}

/**
 * Search for a sim record in the meta store.
 * First search by ICCID and take the most recently added record.
 * If this is not in a status that allows the sim to be deactivated,
 * then the same search will be repeated but with using the Static_IP.
 * An error will be thrown in any of the following cases:
 *  - no sim could be found
 *  - sim could be found but is in a status does not allow deactivation
 *  - sim could be found but aws id is not matching the one passed to the function
 * @param ICCID
 * @param Static_IP
 * @param awsId
 * @returns {sim}
 */
async function getSimForDeactivation(ICCID, Static_IP, awsId) {
    let simFromMetaStore = await getSimFromMetaStore(ICCID_KEY_NAME, ICCID);

    if (!simFromMetaStore || ((simFromMetaStore.status && ALLOWED_STATUSES_FOR_DEACTIVATION.indexOf(simFromMetaStore.status) < 0) || !simFromMetaStore.status)) {
        simFromMetaStore = await getSimFromMetaStore(IP_KEY_NAME, Static_IP);
        if (!simFromMetaStore) {
            throw new Error(`Sim [ICCID: ${ICCID}, Static_IP: ${Static_IP}] does not exist in ${STATUS_TABLE}.`);
        }

        if (simFromMetaStore && ((simFromMetaStore.status && ALLOWED_STATUSES_FOR_DEACTIVATION.indexOf(simFromMetaStore.status) < 0) || !simFromMetaStore.status)) {
            throw new Error(`Sim [ICCID: ${ICCID}, Static_IP: ${Static_IP}] in ${STATUS_TABLE} is in a conflicting status.`);
        }
        //TODO: We could find a sim by ICCID and one by Static_IP that are both eligible for deactivation. Throw error or take most recent?
    }

    if (simFromMetaStore.aws_id && simFromMetaStore.aws_id !== awsId) {
        throw new Error(`Sim [UUID: ${simFromMetaStore.uuid}] is registered with different aws id [${simFromMetaStore.aws_id} <> ${awsId}] in ${STATUS_TABLE}.`);
    }

    return simFromMetaStore;
}

/**
 * Get sim from meta store by key name and value. When more sims are found, the most recent (by created date) is taken
 * @param keyName (ICCID|Static_IP)
 * @param keyValue (ICCID|Static_IP)
 * @returns {Promise<sim>}
 */
async function getSimFromMetaStore(keyName, keyValue) {
    //Gets the certificate key corresponding to the Static_IP from the metastore dynamodb
    let sims = await dynHelper.getByValue(STATUS_TABLE, getIndexByKeyName(keyName), keyName, keyValue, true, 1);
    return sims ? sims[0] : undefined;
}

/**
 * Builds SQS queue name based on the provided parameters
 * @param awsId
 * @param sqsName
 * @param region
 * @returns {string}
 */
function getCustomerQueueName(awsId, sqsName, region) {
    return `https://sqs.${region}.amazonaws.com/${awsId}/${sqsName}`;
}

/**
 * Creates sim meta store index name based on the provided key (index name = keyname_index)
 * @param keyName (ICCID|Static_IP)
 * @returns {string}
 */
function getIndexByKeyName(keyName) {
    return keyName + "_index";
}

module.exports = {
    SIM_STATUSES,
    getSimByICCID,
    getSimByIP,
    createSim,
    activateSim,
    deactivateSim,
    failActivation,
    finalizeActivation,
    finalizeDeactivation,
    failDeactivation
};
