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

io.on('connection', function(socket) {
	console.log('connection open');

    socket.on('register', (req)=>{userEvents.register(req, socket)});
    socket.on('loginPi', (req)=>{piEvents.login(req, socket)});
    socket.on('login', (req)=>{userEvents.login(req, socket)});
    socket.on('saveConfig', (req)=>{configEvents.saveConfig(req, socket)});
    socket.on('forwardCommand', forwardCommand(req, socket));

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

function forwardCommand(req, socket) {
    console.log(req);
    //ioClient.connect('http://localhost:4000').emit('command', req.command);
}

http.listen(process.env.PORT, process.env.IP, function() {
	console.log('listening on '+ process.env.IP+":"+process.env.PORT);
});
