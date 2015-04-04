var express = require('express');
var request = require('request').defaults({ encoding: null });
var hbs = require('hbs');
var db = require('./database.js');
var Q = require('q');
var bodyParser = require('body-parser');
var path = require('path');
var session	= require('express-session');

var app = express();
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(session({secret: '<a long complicated sequence of characters and symbols>',saveUninitialized: true,resave: true}));
app.engine('html', hbs.__express);

var sess;

app.get('/', function(req, res) {
	console.log('homepage loaded')
	sess=req.session;
	if(sess.token)
	{
		res.redirect('/console');
	}
	else{
		res.render('index',{title:"CHIRON", layout:"layout"});
	}
});


app.get('/console', function(req,res) {
	console.log('in console')
	sess=req.session;
	if(sess.token)	
	{
		console.log('sess.token found')
		db.getUserByKey(sess.token).then(function(val){
			res.render('console',{title:"Console", user: val.displayName})
		});
	}
	else
	{
		res.write('<h1>Please login first.</h1>');
		res.end('<a href='+'/'+'>Login</a>');
	}
	
});


app.get('/about', function(req,res) {
	res.render('about',{title:"About CHIRON"})
});


app.post('/login',function(req,res){
	console.log('in login')
	sess=req.session;
	email = req.body.email
	password = req.body.password
	db.getUser(email,password).then(function(val){
		sess.token=val.streamKey;
		res.end('done');
	});
});


app.post('/createUser',function(req,res){
	console.log('in create user')
	sess=req.session;
	email = req.body.email
	password = req.body.password
	db.createUser(email,password).then(function(val){
		sess.token=val.streamKey;
		res.end('done');
	});
});


app.get('/logout',function(req,res){
	req.session.destroy(function(err){
		if(err){
			console.log(err);
		}
		else
		{
			res.redirect('/');
		}
	});
});


app.listen(8080);