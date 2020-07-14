/***************************************************************************************
 * Success responses
 ***************************************************************************************/

/**
 * Creates a http "ok" response
 * @param object: response body
 * @param headers: custom response headers
 * @returns {{status: number, body: *, headers: *}}
 */
function ok(object, headers) {
  return {
    status: 200,
    body: object,
    headers: headers ? headers : undefined
  };
}

/**
 * Creates a http "created" response
 * @returns {{status: number}}
 */
function created() {
  return {
    status: 201
  };
}

/**
 * Creates a http "no content" response
 * @returns {{status: number}}
 */
function noContent() {
  return {
    status: 204
  };
}

/***************************************************************************************
 * Client side error responses
 ***************************************************************************************/

/**
 * Creates a http "bad request" response
 * @param message: "bad request" error message(s), used as response body
 * @returns {{status: number, body: *}}
 */
function badRequest(message) {
  return {
    status: 400,
    body: message
  };
}

/**
 * Creates a http "not found" response
 * @param message: "not found" error message, used as response body
 * @returns {{status: number, body: *}}
 */
function notFound(message) {
  return {
    status: 404,
    body: message
  };
}

/***************************************************************************************
 * Server side error responses
 ***************************************************************************************/

/**
 * Creates a http "internal server error" response
 * @returns {{status: number}}
 */
function internalServerError() {
  return {
    status: 500
  };
}

module.exports = {
  //success
  ok,
  created,
  noContent,
  //client error
  badRequest,
  notFound,
  //server error
  internalServerError
};
