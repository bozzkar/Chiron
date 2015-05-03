var express = require('express');
var app = express();
var request = require('request').defaults({ encoding: null });
var hbs = require('hbs');
var db = require('./database.js');
var Q = require('q');
var bodyParser = require('body-parser');
var path = require('path');
var session	= require('express-session');
var server = require('http').Server(app)
var io = require('socket.io')(server)

app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(session({secret: '<a long complicated sequence of characters and $ymb0ls>',saveUninitialized: true,resave: true}));
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


app.get('/profile/:dpname', function(req,res) {

	name = req.params.dpname;
	sess = req.session;
	db.getUserByName(name).then(function(val){
		res.render('profile',{title: val.displayName+" - CHIRON", key: val.streamKey});
	});
});

app.get('/about', function(req,res) {
	res.render('about',{title:"About CHIRON"})
});


app.post('/login',function(req,res){
	console.log('in login')
	sess=req.session;
	email = req.body.email
	password = req.body.pass
	db.getUser(email,password).then(function(val){
		sess.token=val[0].streamKey;
		sess.user = val[0].displayName;
		res.end('done');
	});
});


app.post('/createUser',function(req,res){
	console.log('in create user')
	sess=req.session;
	email = req.body.email
	password = req.body.pass
	db.createUser(email,password).then(function(val){
		console.log(val)
		sess.token=val.streamKey;
		sess.user = val.displayName;
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


app.get('/chat/:id',function(req, res){
	var id = req.params.id
	res.render('chat',{title: id+" - Chat", layout: 'layout2'});
});

app.get('/baskar', function(req,res) {
	res.render('baskar')
});

app.get('/ttt/:id', function(req, res) {
	var id = req.params.id
	res.render(id)
});










// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.to(socket.room).emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (data) {
    // we store the username in the socket session for this client
    username = data.username
    room = data.room
    socket.username = username;
    socket.room = room;

    socket.join(room)
    // add the client's username to the global list
    usernames[username] = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.to(room).emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.to(socket.room).emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.to(socket.room).emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.to(socket.room).emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});


server.listen(8080);