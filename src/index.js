const appoint = require('./appoint')
const Appoint = appoint.default || appoint

Appoint.polyfill = function polyfill() {
    (function(global) {
        if (typeof global.Promise !== "function") {
            global.Promise = Appoint;
        }
    })(typeof global === "undefined" ? window : global)
}
module.exports = Appoint
