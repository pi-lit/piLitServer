var models = require('../database/models.js');

function getPublicConfigs(req, socket) {
    var res = {error: ""};

    console.log("Get public config: ");

    models.Config.find({isPublic: true}, function(err, publicConfigs) {
        if(err) res.error = "internal database error";
        else if(!publicConfigs) res.error = "no public configs";

        if(res.error) {
            socket.emit('getPublicConfigs', res);
            return;
        }

        socket.emit("getPublicConfigs", publicConfigs);
    });
}

function savePublicConfig(req, socket) {
    var res = {error: ""};

    console.log("Save public config: "+ req.configName);

    if(!req.userName || !req.configName) {
        res.error = "invalid request";
        socket.emit('savePublicConfig', res);
        return;
    }

    models.Config.findOne({userName: req.userName, configName: req.configName}, function(err, config) {
        if(err) res.error = "internal database error";
        else if(!config || !config.isPublic) res.error = "config does not exist";
        else if(config.userName == socket.user.userName) res.error = "config is already owned";

        if(res.error) {
            socket.emit('savePublicConfig', res);
            return;
        }

        newConfig = new models.Config(config);
        newConfig.userName = socket.user.userName;
        newConfig.configName = config.configName+" ("+config.userName+")";
        newConfig.isPublic = false;
        console.log(newConfig);

    	newConfig.save(function(err){
    		if(err) res.error = "internal database error";

            socket.emit('savePublicConfig', newConfig);
    	});
    });
}

function saveConfig(req, socket) {
    var res = {error: ""};

    console.log("Save config: "+ req);

    if(!req.userName || !req.configName /**|| req.userName != socket.user.userName*/) {
        res.error = "invalid request";
        socket.emit('saveConfig', res);
        return;
    }

    models.Config.findOne({userName: req.userName, configName: req.configName}, function(err, config) {
        if(err) res.error = "internal database error";
        else if(config) res.error = "config already exists";

        if(res.error) {
            socket.emit('saveConfig', res);
            return;
        }

        var newConfig = {};

        if(config) {
            newConfig = config;
            Object.assign(newConfig._doc, req);
        }
        else
            newConfig = new models.Config(req);

    	newConfig.save(function(err){
    		if(err) res.error = "internal database error";
            console.log("New Config saved");
            socket.emit('saveConfig', newConfig);
    	});
    });
}

function deleteConfig(req, socket) {
    var res = {error: ""};

    console.log("Delete config: "+ req.configName);

    if(!req.userName || !req.configName || socket.user.userName != req.userName) {
        res.error = "invalid request";
        socket.emit('deleteConfig', res);
        return;
    }

    models.Config.deleteOne({userName: req.userName, configName: req.configName}, function(err) {
        if(err) res.error = "internal database error";
        //else if(config) res.error = "config already exists";

        if(res.error) {
            socket.emit('deleteConfig', res);
            return;
        }

        res = req;
        res.error = "";
        socket.emit('deleteConfig', res);
    });
}

function forwardCommand(req, socket) {
    console.log(req);
    ioClient.connect('http://localhost:4000').emit('command', req);
}

module.exports = {
    getPublicConfigs,
    savePublicConfig,
    saveConfig,
    deleteConfig,
    forwardCommand
};
