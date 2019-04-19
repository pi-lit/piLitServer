var mongoose = require('mongoose');

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

var User = mongoose.model('user', new mongoose.Schema({
    userName: String,
    password: String,
    email: String,
    name: String
}));

var RaspberryPi = mongoose.model('raspberry_pi', new mongoose.Schema({
    userName: String,
    piName: String,
    description: String
}));

var Config = mongoose.model('config', new mongoose.Schema({
    userName: String,
    configName: String,
    description: String,
    isPublic: Boolean,
    commandArray: []
}));

module.exports = {
    User,
    RaspberryPi,
    Config
};
