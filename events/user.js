var models = require('../database/models.js');
var configEvents = require('./config.js');
var piEvents = require('./pi.js');
var maps = require('./maps.js');

function register(req, socket) {
	var res = {error: ""};

	console.log("register event: ");
	console.log(req);

	if(!req || !req.userName || !req.password || !req.email) {
		res.error = "username, email, and password are required";
		socket.emit('register', res);
		return;
	}

    models.User.findOne({userName: req.userName}, function(err, user) {
        if(err) res.error = "internal database error";
        else if(user) res.error = "username is already taken";

        if(res.error) {
            socket.emit('register', res);
            return;
        }

        user = new models.User(req);

    	user.save(function(err){
    		if(err) res.error = "internal database error";

            socket.user = req;
            Object.assign(res, user._doc);
            socket.emit('register', res);
    	});
    });
}

function login(req, socket) {
    var res = {error: ""};

	console.log("login event: ");
	console.log(req);

    if(!req || !req.userName || !req.password) {
        res.error = "username and password are required";
        socket.emit('login', res);
        return;
    }

    models.User.findOne(req, function(err, user) {
        if(err) res.error = "internal database error";
        else if(!user) res.error = "user not found";

        //Authentication failed
        if(res.error) {
            socket.emit('login', res);
            return;
        }
        else {
            //user._doc is the actual document
            Object.assign(res, user._doc);
        }

        models.Config.find({userName: user.userName}, function(err, configs) {
            if(err) res.error = "internal database error";
            else res.configs = configs;

            models.RaspberryPi.find({userName: user.userName}, function(err, piList) {
                if(err) res.error = "internal database error";
                else res.piList = piList;

				maps.user.set(res.userName, socket);
                socket.user = res;

                socket.on('getPublicConfigs', (req)=>{configEvents.getPublicConfigs(req, socket)});
                socket.on('savePublicConfig', (req)=>{configEvents.savePublicConfig(req, socket)});
                socket.on('saveConfig', (req)=>{configEvents.saveConfig(req, socket)});
                socket.on('deleteConfig', (req)=>{configEvents.deleteConfig(req, socket)});
                socket.on('command', (req)=>{forwardCommand(req, socket)});

                socket.emit('login', res);
            });
        });
    });
}

function forwardCommand(req, socket) {
	var res = {};

	console.log('forward command:');
	console.log(req);

    //forward command error messages
	if(!req) {
        res.error = "no object was sent";
        console.log(res.error);
        socket.emit('command', res);
        return;
    } else if(!req.pi) {
        res.error = "no pi object";
        console.log(res.error);
        socket.emit('command', res);
        return;
    } else if(!req.pi.userName) {
        res.error = "no username in the pi object";
        console.log(res.error);
        socket.emit('command', res);
        return;
    } else if(!req.pi.piName) {
        res.error = "no piName in the pi object";
        console.log(res.error);
        socket.emit('command', res);
        return;
    } else if(req.pi.userName != socket.pi.userName) {
        res.error = "sent and socket usernames do not match";
        console.log(res.error);
        socket.emit('command', res);
        return;
    }

    var piSocket = maps.pi.get(req.pi.userName+":"+req.pi.piName);

	if(!piSocket) {
		res.error = "device is not available";
		socket.emit('command', res);
		return;
	}

	piSocket.emit('command', req);
}

module.exports = {
    register,
    login
};
