var models = require('../database/models.js');
var mongoose = require('mongoose');

function getPublicConfigs(req, socket) {
    var res = {error: ""};

    console.log("Get public config event: ");

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

    console.log("Save public config event: ");
    console.log(req);

    if(!req || !req._id) {
        res.error = "invalid request";
        socket.emit('savePublicConfig', res);
        return;
    }

    models.Config.findById(req._id, function(err, config) {
        if(err) res.error = "internal database error";
        else if(!config || !config.isPublic) res.error = "config does not exist";

        if(res.error) {
            socket.emit('savePublicConfig', res);
            return;
        }

        var newConfig = new models.Config(req);
        newConfig._id = new mongoose.Types.ObjectId();
        newConfig.isNew = true;

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

function deleteConfig(req, socket) {
    var res = {error: ""};

    console.log("Delete config event: ");
    console.log(req);

    if(!req || !req._id || req.userName != socket.user.userName) {
        res.error = "invalid request";
        socket.emit('deleteConfig', res);
        return;
    }

    models.Config.deleteOne({_id: req._id, userName: req.userName}, function(err) {
        if(err) res.error = "internal database error";

        if(res.error) {
            socket.emit('deleteConfig', res);
            return;
        }

        res = req;
        res.error = "";
        socket.emit('deleteConfig', res);
    });
}

function saveConfig(req, socket) {
    var res = {error: ""};

    console.log("Save config event: ");
    console.log(req);

    if(!req || !req.userName || !req.configName || req.userName != socket.user.userName) {
        res.error = "invalid request";
        socket.emit('saveConfig', res);
        return;
    }

    var config = new models.Config(req);

    models.Config.findOneAndUpdate({"configName": req.configName}, config, {new: true, upsert: true}, function(err, newConfig) {
        if(err) res.error = "internal database error";

        console.log("config saved");

        socket.emit('saveConfig', newConfig);
    });
}

module.exports = {
    getPublicConfigs,
    savePublicConfig,
    saveConfig,
    deleteConfig
};
