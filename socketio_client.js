// Socket.io client to collect and send light commands to the light table
// Sits on the raspberry pi between the server and arduino microcontroller
//
// Bereket Abraham

var io = require('socket.io-client'),
    serialPort = require("serialport");

// initialize table values, array to hold light values
var lenr = 8;
var lenc = 13;
var colorArr = new Array(lenr * lenc);

for (var i = 0; i < lenr * lenc; i++) {
    colorArr[i] = '000000';
}

// locate the arduino serial port
var port = '/dev/ttyACM0';
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
    console.log('RPI: Serial port opened');

    // react to arduino sensed events
    serial.on('data', function(data) {
        console.log( 'Arduino: ' + data.toString('ascii') );
    });

    serial.on('close', function(data) {
        console.log( 'RPI: Serial port closed: ' + JSON.stringify(data) );
    });

    serial.on('error', function(error) {
        console.log( 'RPI: Serial port error: ' + JSON.stringify(error) );
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

var sendColorByte = function( colormsg ) {
    var ind = parseInt( colormsg.substring(0, 3) );
    var colorhex = colormsg.substring(5, colormsg.length);
    colorArr[ind] = colorhex;

    var buf1 = new Buffer( intToHex(ind, 4), 'hex' );
    var buf2 = new Buffer( colorhex, 'hex' );
    var buf = Buffer.concat( [buf1, buf2], 5 );

    serial.write(buf, function(error) {
        console.log('RPI: serial error: ' + JSON.stringify(error));
      });

    // necessary??
    serial.drain();

}

var sendColor = function( colormsg ) {
    var index = colormsg.substring(0, 3);
    var colorhex = colormsg.substring(5, colormsg.length);
    colorArr[parseInt( index )] = colorhex;

    serial.drain();
    serial.write(index + colorhex + 'X');
}

// Use with Express 3/4 or standalone server. use io() for http server
var socket = io.connect('http://bereketabraham.com:8080');

// comm API
    // 'initial_state', 'local_update' => 'remote_updates', 'remote_update'
socket.on('connect', function(msg) {
    console.log('Server: connected: ' + JSON.stringify(msg));
});

socket.on('remote_update', function(msg) {
    console.log('Server: remote_update: ' + msg);
    sendColor(msg);
});

socket.on('remote_updates', function(msg) {
    console.log('Server: remote_updates');

    // set the initial state of the table
    var initialColors = msg.split(',');
    for (var i = 0; i < initialColors.length; i++) {
        sendColor( initialColors[i] );
    }
});

socket.on('disconnect', function(msg) {
    console.log('Server: disconnected: ' + JSON.stringify(msg));
});

socket.on('error', function(msg) {
    console.log('Server: errored: ' + JSON.stringify(msg));
});

// get initial state of table
socket.emit('initial_state', 'n/a');

