var piEvents = require('./pi.js');
var maps = require('./maps.js');

function forwardVoiceCommand(req) {
    var res = {};

    console.log('forward voice command:');
    console.log(req);

    var piSocket = maps.pi.get("testuser:testpi");

    if(!piSocket) {
        res.error = "device is not available";
        return;
    }
    piSocket.emit('voiceCommand', req);
}

module.exports = {
    forwardVoiceCommand,
};