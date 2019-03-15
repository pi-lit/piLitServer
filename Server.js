//Central Server

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var WebSocket = require('ws');

io.on('connection', function(socket) {
	console.log('connection open');

	socket.on('command', function(command) {
		console.log('received command: '+ command.type);

		var piSocket = new WebSocket("ws://localhost:4000");

		piSocket.onopen = function(event) {
			piSocket.send("turn on");
		};
	});

	socket.on('disconnect', function(command) {
		console.log("disconnected");
	});
});

http.listen(3000, function()
{
	console.log('listening on *:3000');
});
