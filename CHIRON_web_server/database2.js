var mongoose = require('mongoose');
var Q = require('q');
var crypto = require('crypto');

// connect to mongo database
mongoose.connect('mongodb://10.240.15.72/chiron-db');
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
    User.find({ emailAddr: email, password: password }, function(err, res) {
        if(err) {
            console.log('getUser err')
            d.reject(new Error(err));
        } else if(!res) {
            console.log('getUser !res')
            d.reject(new Error("user email not found"));
        } else if (res.length == 0) {
            console.log('res length == 0')
            d.reject(new Error("res length == 0"))
        } else {
            console.log('getUser resolve')
            console.log(res)
            d.resolve(res);
        }
    });
    return d.promise;
};


// return user object with corresponding email, password
exports.getUserByName = function(name) {
    var d = Q.defer();
    User.findOne({ displayName: name }, function(err, res) {
        if(err) {
            console.log('getUser err')
            d.reject(new Error(err));
        } else if(!res) {
            console.log('getUser !res')
            d.reject(new Error("user name not found"));
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
            d.reject(new Error("user key not found"));
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


var checkUser = function(email) {
    var d = Q.defer();
    User.find({ emailAddr: email }, function(err, res) {
        if(err) {
            console.log('getUser err')
            d.reject(new Error(err));
        } else if(!res) {
            console.log('getUser !res')
            d.reject(new Error("user name not found"));
        } else {
            console.log('getUser resolve')
            d.resolve(res);
        }
    });
    return d.promise;
}

// helper function to create User object
// also checks for duplication
var createUserObject = function(email, password) {
    var d = Q.defer();
    var user;
    checkUser(email).then(function(val){
        // User exist, do nothing
        if (val.length>0) {
            console.log("user exists, no new entry created");
            console.log(val.toString())
            d.reject(new Error("user existed"));
        }
        else {
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
        }

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







