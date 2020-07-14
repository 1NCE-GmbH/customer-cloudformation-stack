"use strict";

/**
 * make response object. AWS HTTP response should be like:
 {
  "isBase64Encoded" : "boolean",
  "statusCode": "number",
  "headers": { ... },
  "body": "JSON string"
}
 */
module.exports = class Response {
  constructor(code, body, headers) {
    this.statusCode = code ? code : 200;
    if (body) {
      if (typeof body === "string") {
        if (!headers || headers === "application/json") {
          this.body = {
            message: body
          }; // if there is no header turn the body into a JSON object
        } else {
          this.body = body;
        }
      } else {
        this.body = body;
      }
      this.body = JSON.stringify(this.body); // needs to be string or else 500
    }
    this.headers = headers;
  }
};
