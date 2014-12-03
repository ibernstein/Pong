// Require the packages we will use:
var http = require("http"), socketio = require("socket.io"), fs = require("fs");
 
// Listen for HTTP connections.  This is essentially a miniature static file server that only serves our one file, client.html:
var app = http.createServer(function(req, res){
  // This callback runs when a new connection is made to our HTTP server.
  if(req.url.indexOf('client_home.html') != -1){ //req.url has the pathname, check if it conatins '.html'
    fs.readFile(__dirname + '/client_home.html', function (err, data) {
      if (err) console.log(err);
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
      res.end();
    });
  }
  if(req.url.indexOf('client_game_one.html') != -1){ //req.url has the pathname, check if it conatins '.html'
    fs.readFile(__dirname + '/client_game_one.html', function (err, data) {
      if (err) console.log(err);
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
      res.end();
    });
  }
  if(req.url.indexOf('client_home.css') != -1){ //req.url has the pathname, check if it conatins '.css'
    fs.readFile(__dirname + '/client_home.css', function (err, data) {
      if (err) console.log(err);
      res.writeHead(200, {'Content-Type': 'text/css'});
      res.write(data);
      res.end();
    });
  }
  if(req.url.indexOf('client_game_one.css') != -1){ //req.url has the pathname, check if it conatins '.css'
    fs.readFile(__dirname + '/client_game_one.css', function (err, data) {
      if (err) console.log(err);
      res.writeHead(200, {'Content-Type': 'text/css'});
      res.write(data);
      res.end();
    });
  }
  if(req.url.indexOf('pong_one.js') != -1){ //req.url has the pathname, check if it conatins '.css'
    fs.readFile(__dirname + '/pong_one.js', function (err, data) {
      if (err) console.log(err);
      res.writeHead(200, {'Content-Type': 'text/javascript'});
      res.write(data);
      res.end();
    });
  }
  if(req.url.indexOf('pong_two.js') != -1){ //req.url has the pathname, check if it conatins '.css'
    fs.readFile(__dirname + '/pong_two.js', function (err, data) {
      if (err) console.log(err);
      res.writeHead(200, {'Content-Type': 'text/javascript'});
      res.write(data);
      res.end();
    });
  }
});

app.listen(2345);
//Auto Generated user_id & game_id
var auto_user_id = 1, auto_game_id = 1;
//Room and users that are currently active
var rooms = [], playing = [], users = [];
// Do the Socket.IO magic:
var io = socketio.listen(app);
io.sockets.on("connection", function(socket){
  //add new user to server
  socket.on('adduser', function(data){
    var tempUser = {
      nickname: data,
      id: auto_user_id
    }
    auto_user_id++;
    users.push(tempUser);
    socket.join('home');
    socket.emit('id_assigned', {user_id:tempUser.id});
    io.sockets.to('home').emit('update', {rooms_list:rooms, closed:playing});
  });
  socket.on('hello', function(data){
    console.log(data);
  });
  socket.on('create_room', function(data){
    var newRoom = {
      game_id:auto_game_id,
      room_name:data['room'],
      playerOne:data['user_id'],
      playerTwo:0
    }
    auto_game_id++;
    rooms.push(newRoom);
    socket.join(newRoom.game_id);
    socket.leave('home');
    socket.emit('redirectcreate', {room:newRoom.game_id, roomname:newRoom.room_name, object:newRoom, user:data['user'], user_id:data['user_id']});
    io.sockets.to('home').emit('update', {rooms_list:rooms, closed:playing});
    //Redirect to game page
  });
  socket.on('redirected', function(data){
    if (data['object'].playerOne == data['user_id']) {
      console.log(data['object'].playerOne + "  " + data['user_id']);
      io.sockets.to(data['room']).emit('createPlayerOne', data);
    }else{
      io.sockets.to(data['room']).emit('createPlayerTwo', data); 
    }
  });
  socket.on('join_game', function(data){
    for(var i = 0; i < rooms.length; i++){
      if (data["room"] == rooms[i].game_id) {
        rooms[i].playerTwo = data["user_id"];
        socket.leave('home');
        socket.join(rooms[i].game_id);
        io.sockets.to(rooms[i].game_id).emit('redirectjoin', {room:data['room'], roomname:data['roomname'], object:rooms[i], user:data['user'], user_id:data['user_id']});
        playing.push(rooms[i]);
        rooms.splice(i,1);
        io.sockets.to('home').emit('update', {rooms_list:rooms, closed:playing});
      }
    }
  });
  socket.on('game_start', function(data){
    io.sockets.to(data['room']).emit('start', data);
  });
  socket.on('game_restart', function(data){
    io.sockets.to(data['room']).emit('restart', data);
  });
  socket.on('play', function(data){
    io.sockets.to(data['room']).emit('running', data);
  });
  socket.on('move_paddle', function(data){
    io.sockets.to(data['room']).emit('movement', data);
  });
  socket.on('game_over', function(data){
    io.sockets.to(data['room']).emit('end', data);
  });
  socket.on('leaving', function(data){
    socket.join('home');
    for(var i = 0 ; i < playing.length; i++){
      
      if (playing[i].game_id == data['room']) {
        playing.splice(i,1);
      }
    }
    for(var i = 0 ; i < rooms.length; i++){
      if (rooms[i].game_id == data['room']) {
        rooms.splice(i,1);
      }
    }
    socket.leave(data['room']);
    io.sockets.to(data['room']).emit('leave', data);
    io.sockets.to('home').emit('update', {rooms_list:rooms, closed:playing});
  });
});
