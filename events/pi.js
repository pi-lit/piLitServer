var models = require('../database/models.js');
var maps = require('./maps.js');

function login(req, socket) {
    var res = {error: ""};

    console.log("Login pi: "+ req.piName);

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

    if(!res || !res.pi || !res.pi.userName || !res.pi.piName || res.pi.userName != socket.pi.userName) {
		errorRes.error = "invalid response from device";
		socket.emit('command', errorRes);
		return;
	}

    var clientSocket = maps.user.get(res.pi.userName);

    clientSocket.emit('command', res);
}

module.exports = {
    login,
    forwardResponse
};
