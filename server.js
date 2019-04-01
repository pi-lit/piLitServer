//Central Server

var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var ioClient = require('socket.io-client');

var mongoose = require('mongoose');
var schemas = require('./schemas.js');
var User = mongoose.model('user', schemas.userSchema);
var Config = mongoose.model('config', schemas.configSchema);
var RaspberryPi = mongoose.model('raspberry_pi', schemas.raspberryPiSchema);

//attempt connection to mongo atlas DB
mongoose.connect('mongodb+srv://pi-lit-db-user:EBQ0fF6WUD9TLQjM@cis-db-fxsbk.mongodb.net/Pi-Lit?retryWrites=true', {useNewUrlParser: true})
//resolve promise
.then(
    () => {
        console.log("successfull db connect"); //notify success
    },
    err => {
        console.log(err); //display error case : NOTE no formal handling implemented
    }
)

var pendingCommands = new Map();

setInterval(function() {
    for(var command of pendingCommands) {
        if(Date.now() - command.time > 5000)
            penndingCommands.delete(command.request.userName+":"+command.request.piName);
    }
}, 5000);

io.on('connection', function(socket) {
	console.log('connection open');

    socket.on('register', function(req){register(req, socket)});
    socket.on('loginPi', function(req){loginPi(req, socket)})
    socket.on('login', function(req){login(req, socket)});

    socket.on('disconnect', function(req) {
        console.log("disconnected");
    });

    setTimeout(function() {
        if(socket.user == undefined && socket.pi == undefined) {
            console.log("connection did not authenticate");
            socket.disconnect();
        }
    }, 15000);
});

http.listen(8080, function() {
	console.log('listening on *:8080');
});

function register(req, socket) {
	var res = {error: ""};

	console.log("register event: "+req.userName);

	if(!req.userName || !req.password || !req.email) {
		res.error = "username, email, and password are required";
		socket.emit('register', res);
		return;
	}

    User.findOne({userName: req.userName}, function(err, user) {
        if(err) res.error = "internal database error";
        else if(user) res.error = "username is already taken";

        if(res.error) {
            socket.emit('register', res);
            return;
        }

        user = new User(req);

    	user.save(function(err){
    		if(err) res.error = "internal database error";

            Object.assign(res, user._doc);
            socket.emit('register', res);
    	});
    });
}

function login(req, socket) {
    var res = {error: ""};

    console.log("login event: "+req.userName);

    if(!req.userName || !req.password) {
        res.error = "username and password are required";
        socket.emit('login', res);
        return;
    }

    User.findOne(req, function(err, user) {
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

        Config.find({userName: user.userName}, function(err, configs) {
            if(err) res.error = "internal database error";
            else res.configs = configs;

            RaspberryPi.find({userName: user.userName}, function(err, piList) {
                if(err) res.error = "internal database error";
                else res.piList = piList;

                socket.user = res;
                socket.on('command', function(req){requestConnection(req, socket)});

                socket.emit('login', res);
            });
        });
    });
}

function loginPi(req, socket) {
    var res = {error: ""};

    console.log("Login pi: "+ req.piName);

    if(!req.userName || !req.piName || !req.password) {
        res.error = "sername, device name, and password are required";
        socket.emit('loginPi', res);
        return;
    }

    RaspberryPi.findOne({userName: req.userName, piName: req.piName, password: req.password}, function(err, pi) {
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

    RaspberryPi.findOne({userName: req.pi.userName, piName: req.pi.piName}, function(err, pi) {
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
