// Socket.io client to collect and send light commands to the light table
// Sits between the raspberry pi and the arduino microcontroller
//
// Bereket Abraham

var io = require('socket.io-client'),
    serialPort = require("serialport");

// initialize table values, array to hold light values
var lenr = 10;
var lenc = 15;
var colorArr = new Array(lenr * lenc);

for (var y = 0; y < lenr; y++) {
    for (var x = 0; x < lenc; x++) {
        var index = y*lenc + x;
        colorArr[index] = '22CCCC';
    }
}

// locate the arduino serial port
var port = '';
var serialPort = require("serialport");
serialPort.list(function (err, ports) {
    ports.forEach(function(p) {
        if (p.pnpId.indexOf('arduino') > -1) {
            port = p.comName;
        }
    });
});
console.log(port);
// open serial connection
var serial = new serialPort.SerialPort(port, {
  baudrate: 9600
});

serial.on('open', function() {
    console.log('Serial port opened');

    // react to arduino sensed events
    serial.on('data', function(data) {
        console.log( 'serial: ' + data.toString('ascii') );
    });

    serial.on('close', function(data) {
        console.log( 'Serial port closed: ' + JSON.stringify(data) );
    });

    serial.on('error', function(error) {
        console.log( 'Serial port error: ' + JSON.stringify(error) );
    });
    serial.drain();
});


// convert ints into hex strings with a set number of padded digits
var intToHex = function ( num, digits ) {
    var hex = num.toString(16);
    for (var j = hex.length; j < digits; j++) {
        hex = '0' + hex;
    }
    return hex;
}

var sendColor = function( colormsg ) {
    var ind = parseInt( colormsg.substring(0, 3) );
    var colorhex = colormsg.substring(5, colormsg.length);
    colorArr[ind] = colorhex;

    var buf1 = new Buffer( intToHex(ind, 4), 'hex' );

    var buf2 = new Buffer( colorhex, 'hex' );
    var buf = Buffer.concat( [buf1, buf2], 5 );

    serial.write(buf, function(error) {
        console.log('serial error: ' + JSON.stringify(error));
      });

    // necessary??
    serial.drain();

}


var socket = io.connect('http://192.168.1.6:8080');

// comm API
    // 'initial_state', 'local_update' => 'remote_updates', 'remote_update'
socket.on('connect', function(msg) {
    console.log('connected: ' + JSON.stringify(msg));
});

socket.on('remote_update', function(msg) {
    console.log('remote_update: ' + msg);
    sendColor(msg);
});

socket.on('remote_updates', function(msg) {
    console.log('remote_updates: ' + msg);

    // set the initial state of the table
    var initialColors = msg.split(',');
    for (var i = 0; i < initialColors.length; i++) {
        sendColor( initialColors[i] );
    }
});

socket.on('disconnect', function(msg) {
    console.log('disconnected: ' + JSON.stringify(msg));
});

socket.on('error', function(msg) {
    console.log('errored: ' + JSON.stringify(msg));
});

// get initial state of table
socket.emit('initial_state', null);
