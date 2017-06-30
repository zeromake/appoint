
(function (global) {
    if (typeof global.Promise !== 'function') {
        global.Promise = require('./dist/appint.js');
    }
})(typeof global === 'undefined' ? window : global)
