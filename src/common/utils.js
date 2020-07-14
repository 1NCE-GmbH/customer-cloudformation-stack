'use strict';
const Response = require('./response');

async function processRequest(event, cb) {
    let req;
    try {
        req = event.body ? JSON.parse(event.body) : event;
    } catch (e) {
        return new Response(400, 'Bad JSON!');
    }
    let {body, status, headers} = await cb(req);
    return new Response(status, body, headers);
}

module.exports = {processRequest};
