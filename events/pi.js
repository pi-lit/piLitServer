var ioClient = require('socket.io-client');
var models = require('../database/models.js');

var pendingCommands = new Map();

setInterval(function() {
    for(var command of pendingCommands) {
        if(Date.now() - command.time > 5000)
            penndingCommands.delete(command.request.userName+":"+command.request.piName);
    }
}, 5000);

function login(req, socket) {
    var res = {error: ""};

    console.log("Login pi: "+ req.piName);

    if(!req.userName || !req.piName || !req.password) {
        res.error = "username, device name, and password are required";
        socket.emit('loginPi', res);
        return;
    }

    models.RaspberryPi.findOne({userName: req.userName, piName: req.piName, password: req.password}, function(err, pi) {
        if(err) res.error = "internal database error";
        else if(!pi) res.error = "device is not registered";

        if(res.error) {
            socket.emit('loginPi', res);
            return;
        }

        socket.on('updateAddress', function(req){updateAddress(req, socket)});
        socket.on('requestCommand', function(req){forwardCommand(req, socket)});
        socket.on('commandResponse', function(req){forwardResponse(req, socket)});

        socket.pi = pi;
        Object.assign(res, pi._doc);

        socket.emit('loginPi', res);
    });
}

function requestConnection(req, socket) {
    var res = {error: ""};

    console.log('received command: '+ req.pi.address);

    if(!req.pi || !req.pi.piName || socket.user.userName != req.pi.userName) {
        res.error = "invalid request";
        socket.emit('command', res);
        return;
    }

    models.RaspberryPi.findOne({userName: req.pi.userName, piName: req.pi.piName}, function(err, pi) {
        if(err)res.error = "internal database error";
        else if(!pi) res.error = "device is not registered";

        if(res.error) {
            socket.emit('command', res);
            return;
        }

        pendingCommands.set(pi.userName+":"+pi.piName, {request: req, socket: socket, time: Date.now()});

        ioClient.connect('http://'+pi.address+':4000');
    });
}

function forwardCommand(req, socket) {
    console.log("forwarded command: "+req.address);

    var message = pendingCommands.get(req.userName+":"+req.piName);

    socket.emit('requestCommand', message.request);
}

function forwardResponse(res, socket) {
    var message = pendingCommands.get(res.userName+":"+res.piName);
    pendingCommands.delete(res.userName+":"+res.piName);

    message.socket.emit('command', res);

    socket.disconnect();
}

function updateAddress(req, socket) {
    var res = {error: ""};

    console.log("Update address: "+ req.piName);

    if(req.userName != socket.pi.userName || req.piName != socket.pi.piName || !req.address) {
        res.error = "invalid request";
        socket.emit('updateAddress', res);
        return;
    }

    socket.pi.address = req.address;

	socket.pi.save(function(err){
		if(err) res.error = "internal database error";

        Object.assign(res, socket.pi._doc);
        socket.emit('updateAddress', res);
	});
}

module.exports = {
    login,
    requestConnection,
    forwardCommand,
    forwardResponse,
    updateAddress
};
