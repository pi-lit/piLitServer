//Central Server

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ioClient = require('socket.io-client');

var mongoose = require('mongoose');
var User = mongoose.model('user', new mongoose.Schema({userName: String, email: String, password: String}));
var RaspberryPi = mongoose.model('raspberry_pi', new mongoose.Schema({userName: String, piName: String, address: String}));

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

io.on('connection', function(socket) {
	console.log('connection open');

    socket.on('login', function(req){login(req, socket)});
	socket.on('command', function(req){forwardCommand(req, socket)});

	socket.on('disconnect', function(req) {
		console.log("disconnected");
	});
});

http.listen(3000, function() {
	console.log('listening on *:3000');
});

function login(req, socket) {
    var res = {status: 0, error: "", piList:[]};

    console.log("login event: "+req.userName);

    if(req.userName == undefined || req.password == undefined) {
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

        RaspberryPi.find({userName: user.userName}, function(err, piList) {
            if(err) {
                res.error = "internal database error";
                res.status = 0;
            }
            else res.piList = piList;

            socket.emit('login', res);
        });
    });
}

function forwardCommand(req, socket) {
    console.log('received command: '+ req);

    ioClient.connect('http://localhost:4000').emit('command', req);
}
