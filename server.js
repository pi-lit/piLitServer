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

var pendingMessages = new Map();

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

app.use('/', express.static(path.join(__dirname, 'public')));

io.on('connection', function(socket) {
	console.log('connection open');

    socket.on('login', function(req){login(req, socket)});
	socket.on('command', function(req){requestConnection(req, socket)});
	socket.on('register', function(req){register(req, socket)});
    socket.on('updateAddress', function(req){updateAddress(req, socket)});
    socket.on('requestMessage', function(req){forwardMessage(req, socket)});

	socket.on('disconnect', function(req) {
		console.log("disconnected");
	});
});

http.listen(8080, function() {
	console.log('listening on *:8080');
});

function register(req, socket) {
	var res = {status: 0, error: "", user:{}};

	console.log("register event: "+req.userName);

	if(!req.userName || !req.password || !req.email) {
		res.error = "username, email, and password are required";
		socket.emit('register', res);
		return;
	}

    User.findOne({userName: req.userName}, function(err, user) {
        if(err)res.error = "internal database error";
        else if(user) res.error = "username is already taken";
        else res.status = 1;

        if(!res.status) {
            socket.emit('register', res);
            return;
        }

        user = new User(req);

    	user.save(function(err){
    		if(err) {
                res.status = 0;
                res.error = "internal database error";
            }

            res.user = user;
            socket.emit('register', res);
    	});
    });
}

function login(req, socket) {
    var res = {status: 0, error: ""};

    console.log("login event: "+req.userName);

    if(!req.userName || !req.password) {
        res.error = "username and password are required";
        socket.emit('login', res);
        return;
    }

    User.findOne(req, function(err, user) {
        if(err) res.error = "internal database error";
        else if(!user) res.error = "user not found";
        else res.status = 1;

        //Authentication failed
        if(!res.status) {
            socket.emit('login', res);
            return;
        }
        else {
            //res.user = user wont work because user is unextendable
            //user._doc is the actual document
            res.user = {};
            Object.assign(res.user, user._doc);
        }

        Config.find({userName: user.userName}, function(err, configs) {
            if(err) {
                res.error = "internal database error";
                res.status = 0;
            }
            else res.user.configs = configs;

            RaspberryPi.find({userName: user.userName}, function(err, piList) {
                if(err) {
                    res.error = "internal database error";
                    res.status = 0;
                }
                else res.user.piList = piList;

                socket.emit('login', res);
            });
        });
    });
}

function requestConnection(req, socket) {
    console.log('received command: '+ req.pi.address);

    pendingMessages.set(req.pi.address, req);

    ioClient.connect('http://'+req.pi.address+':4000');
}

function forwardMessage(req, socket) {
    console.log("forwarded message: "+req.address);

    var message = pendingMessages.get(req.address);

    socket.emit('requestMessage', message);
}

function updateAddress(req, socket) {
    var res = {status: 0, error: ""};

    console.log("Update address: "+ req.piName);

    RaspberryPi.findOne({userName: req.userName, piName: req.piName, password: req.password}, function(err, pi) {
        if(err)res.error = "internal database error";
        else if(!pi) res.error = "device is not registered";
        else res.status = 1;

        if(!res.status) {
            socket.emit('updateAddress', res);
            return;
        }

        pi.address = req.address;

    	pi.save(function(err){
    		if(err) {
                res.status = 0;
                res.error = "internal database error";
            }

            res.pi = pi;
            socket.emit('updateAddress', res);
    	});
    });
}
