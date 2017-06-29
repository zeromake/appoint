const Appoint = require('./dist/appoint')

const appoint = new Appoint(function () {
    throw new Error('boom');
}).then(() => {
    console.log('-------')
})
appoint.catch(() => {})