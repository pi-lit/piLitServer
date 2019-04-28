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
var voiceEvents = require('./events/voice.js');

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
    if(command.color) {
        if(command.color == "red") {
            let color = {};
            color.r = 255;
            color.g = 0;
            color.b = 0;
            command.color = color;
        } else if(command.color == "green") {
            let color = {};
            color.r = 0;
            color.g = 255;
            color.b = 0;
            command.color = color;
        } else if(command.color == "blue") {
            let color = {};
            color.r = 0;
            color.g = 0;
            color.b = 255;
            command.color = color;
        } else if(command.color == "black") {
	  let color = {};
            color.r = 0;
            color.g = 0;
            color.b = 0;
            command.color = color;
	} else if(command.color == "white") {
          let color = {};
            color.r = 255;
            color.g = 255;
            color.b = 255;
            command.color = color;
        }

    }
    commandArray.push(command);
    var object = {};
    object.config = {};
    object.config.commandArray = commandArray;
    voiceEvents.forwardVoiceCommand(object);
});

io.on('connection', function(socket) {
	console.log('connection open');

    socket.on('register', (req)=>{userEvents.register(req, socket)});
    socket.on('loginPi', (req)=>{piEvents.login(req, socket)});
    socket.on('login', (req)=>{userEvents.login(req, socket)});
    socket.on('voiceCommand', (req)=>{console.log(req)});

    socket.on('disconnect', function(req) {
        console.log("disconnected");

		if(socket.user)
			maps.user.delete(socket.user.userName);

		if(socket.pi)
			maps.pi.delete(socket.pi.userName+":"+socket.pi.piName);
    });
});

//http.listen(8080);
http.listen(process.env.PORT, process.env.IP);
