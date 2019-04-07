var models = require('../database/models.js');
var configEvents = require('./config.js');
var piEvents = require('./pi.js');

module.exports = {
    register,
    login
};

function register(req, socket) {
	var res = {error: ""};

	console.log("register event: "+req.userName);

	if(!req.userName || !req.password || !req.email) {
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

    console.log("login event: "+req.userName);

    if(!req.userName || !req.password) {
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

                socket.user = res;
                socket.on('getPublicConfigs', (req)=>{configEvents.getPublicConfigs(req, socket)});
                socket.on('savePublicConfig', (req)=>{configEvents.savePublicConfig(req, socket)});
                socket.on('saveConfig', (req)=>{configEvents.saveConfig(req, socket)});
                socket.on('deleteConfig', (req)=>{configEvents.deleteConfig(req, socket)});
                socket.on('command', (req)=>{piEvents.requestConnection(req, socket)});

                socket.emit('login', res);
            });
        });
    });
}