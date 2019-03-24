var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = mongoose.Schema({
    userName: {type:String},
    password: {type:String},
    email: {type:String},
    createdConfigs: [],
    savedConfigs: [],
    piList: []
});

var User = mongoose.model('User', userSchema);

module.export = {
	User: User
};