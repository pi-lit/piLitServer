//Central Server

var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var ioClient = require('socket.io-client');


var piEvents = require('./events/pi.js');
var userEvents = require('./events/user.js');
var configEvents = require('./events/config.js');

var maps = require('./events/maps.js');


app.use(express.json());
app.use('/', express.static(path.join(__dirname, 'public')));
app.post('/voice', function (req, res) {
    var commandArray = [];
    var command = req.body;
    command.range = [];
    for(let i=0;i<30;i++) {
        command.range.push(i);
    }
    commandArray.push(command);
    var object = {};
    object.config = {};
    object.config.commandArray = commandArray;
    forwardVoiceCommand(object);
});

io.on('connection', function(socket) {
	console.log('connection open');

    socket.on('register', (req)=>{userEvents.register(req, socket)});
    socket.on('loginPi', (req)=>{piEvents.login(req, socket)});
    socket.on('login', (req)=>{userEvents.login(req, socket)});

    socket.on('disconnect', function(req) {
        console.log("disconnected");

		if(socket.user)
			maps.user.delete(socket.user.userName);

		if(socket.pi)
			maps.pi.delete(socket.pi.userName+":"+socket.pi.piName);
    });
});

function forwardVoiceCommand(req) {
    var res = {};

    console.log('forward command:');
    console.log(req);

    var piSocket = maps.pi.get("testuser2:testpi2");

    if(!piSocket) {
        res.error = "device is not available";
        return;
    }
    piSocket.emit('command', req);
}

//http.listen(8080);
http.listen(process.env.PORT, process.env.IP);
