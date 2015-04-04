var mongoose = require('mongoose');
var Q = require('q');
var crypto = require('crypto');

// connect to mongo database
mongoose.connect('mongodb://localhost/chiron-db');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	console.log('mongoose connected');
});


// database schemas
var userSchema = mongoose.Schema({
	emailAddr: String,
    password: String,
    displayName: String,
    streamKey: String
});

// models
var User = mongoose.model("User", userSchema);



// return user object with corresponding email, password
exports.getUser = function(email,password) {
    var d = Q.defer();
    User.findOne({ emailAddr: email, password: password }, function(err, res) {
        if(err) {
            console.log('getUser err')
            d.reject(new Error(err));
        } else if(!res) {
            console.log('getUser !res')
            d.reject(new Error("user email not found"));
        } else {
            console.log('getUser resolve')
            d.resolve(res);
        }
    });
    return d.promise;
};


// return user object with corresponding id
exports.getUserByKey = function(key) {
    var d = Q.defer();
    User.findOne({ streamKey: key }, function(err, res) {
        if(err) {
            console.log('getUser err')
            d.reject(new Error(err));
        } else if(!res) {
            console.log('getUser !res')
            d.reject(new Error("user email not found"));
        } else {
            console.log('getUser resolve')
            d.resolve(res);
        }
    });
    return d.promise;
};

// create a new User with specified values
exports.createUser = function(email, password) {
    var d = Q.defer();
    createUserObject(email, password).then(function(val){
        val.save(function(err) {
            if(err) {
                d.reject(new Error(err));
                console.log('error saveObject' + err.toString())
            } else {
                d.resolve(val);
                console.log('resolve saveObject')
            }
        });
    },function(err){
        d.reject(new Error(err));
    });
    return d.promise;
};


// helper function to create User object
// also checks for duplication
var createUserObject = function(email, password) {
    var d = Q.defer();
    var user;
    exports.getUser(email).then(function(val){
        // User exist, do nothing
        console.log("user exists, no new entry created");
        d.reject(new Error("user existed"));
    },function(err){
        // sha-256 for stream key generator
        var h = crypto.createHash('sha256');
        h.update(email)

        console.log("creating new user");
        user = new User({
            emailAddr: email,
            password: password,
            displayName: email.substring(0,email.indexOf('@')),
            streamKey: h.digest('hex')
        });
        d.resolve(user);
    });
    return d.promise;
};







