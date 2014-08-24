// Socket.io client to collect and send light commands to the light table
// Sits between the raspberry pi and the arduino microcontroller
//
// Bereket Abraham

var io = require('socket.io-client');


// Use with Express 3/4 or standalone server. use io() for http server
var socket = io.connect('http://bereketabraham.com/socket.io');

// comm API
    // 'initial_state', 'local_update' => 'remote_updates', 'remote_update'
socket.on('connect', function(msg) {
    console.log('connected: ' + JSON.stringify(msg));
});

socket.on('remote_update', function(msg) {
    console.log('remote_update: ' + msg);
});

socket.on('remote_updates', function(msg) {
    console.log('remote_updates: ' + msg);
});

socket.on('disconnect', function(msg) {
    console.log('disconnected: ' + JSON.stringify(msg));
});

socket.on('error', function(msg) {
    console.log('errored: ' + JSON.stringify(msg));
});

// get initial state of table
socket.emit('initial_state', null);


