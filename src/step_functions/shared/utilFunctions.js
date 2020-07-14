const fs = require("fs");

/**
 * Reads a text file
 *
 * @param path File path
 * @returns {string} Text data
 */
function readFile(path) {
    return fs.readFileSync(path, "utf8");
}

/**
 * Reads a json file
 *
 * @param path File path
 * @returns {any} JSON data
 */
function readJsonFile(path) {
    let fileContent = this.readFile(path);
    return JSON.parse(fileContent);
}

module.exports = {
    readFile,
    readJsonFile
};
