var models = require('../database/models.js');
var maps = require('./maps.js');

function login(req, socket) {
    var res = {error: ""};

    console.log("Login pi: ");
    console.log(req);

    if(!req || !req.userName || !req.piName || !req.password) {
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

        maps.pi.set(pi.userName+":"+pi.piName, socket);
        socket.pi = pi;
        Object.assign(res, pi._doc);

        socket.on('command', function(res){forwardResponse(res, socket)});

        socket.emit('loginPi', res);
    });
}

function forwardResponse(res, socket) {

    var errorRes = {};

    console.log("forward response: ");
    console.log(res);
    if(!res) {
		errorRes.error = "no object was sent";
		socket.emit('command', errorRes);
		return;
	} else if(res.pi.userName != socket.pi.userName) {
        errorRes.error = "sent and socket usernames do not match";
        socket.emit('command', errorRes);
        return;
    } else if(!res.pi) {
        errorRes.error = "no pi object";
        socket.emit('command', errorRes);
        return;
    } else if(!res.pi.userName) {
        errorRes.error = "no username in the pi object";
        socket.emit('command', errorRes);
        return;
    } else if(!res.pi.piName) {
        errorRes.error = "no piName in the pi object";
        socket.emit('command', errorRes);
        return;
    }

    var clientSocket = maps.user.get(res.pi.userName);

    if(!clientSocket) {
        //Drop invalid response (undeliverable)
        console.log('invalid response: missing client: ');
        console.log(res);
		return;
    }

    res.config.error = res.error;

    clientSocket.emit('command', res.config);
}

module.exports = {
    login,
    forwardResponse
};
