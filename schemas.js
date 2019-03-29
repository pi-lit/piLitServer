var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    userName: String,
    password: String,
    email: String,
    savedConfigs: []
});

var raspberryPiSchema = new mongoose.Schema({
    userName: String,
    piName: String,
    address: String
});

var configSchema = new mongoose.Schema({
    userName: String,
    configName: String,
    isPublic: Boolean,
    rpArray: []
});

module.exports = {
    userSchema,
    raspberryPiSchema,
    configSchema
};
