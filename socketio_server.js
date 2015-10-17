// Socket.io server to collect and send light commands to the light table
// Sits on the raspberry pi between the client and arduino microcontroller
// 
// Bereket Abraham

var port = 8002;
var numLed = -1;
var debug = false;

var idx = process.argv.indexOf("--port");
if (idx >= 0 && idx < process.argv.length) {
    port = parseInt( process.argv[idx + 1] );
    console.log("Starting on port " + port.toString());
}
//console.log(JSON.stringify(process.argv));

var io         = require('socket.io').listen(port),
    serialPort = require('serialport');
    sleep      = require('sleep');

////////////////// Data structure to hold light values

var lenr = 8;
var lenc = 13;
if (numLed === -1) {
    numLed = lenr * lenc;
}
var colorArr = new Array(lenr * lenc);

// zero padding a to b places
function pad(a,b) {
    return(1e15+a+"").slice(-b)
}

function fullColorSet(arr) {
    var msg = '';
    for (var i = 0; i < arr.length; i++) {
        msg += pad(i, 3) + ':' + arr[i] + ',';
    }
    msg = msg.substring(0, msg.length-1);
    return msg;
}

/////////////////// Serial port with Arduino

function getSerialPortDevice() {
    var device = '/dev/ttyACM0';
    var found = false;
    serialPort.list(function (err, ports) {
        ports.forEach(function(p) {
            if (p.pnpId.indexOf('arduino') > -1) {
                device = p.comName;
                found = true;
            }
        });
    });
    if (found === false && debug === false) {
        throw "Arduino serial port not found";
    }

    console.log(JSON.stringify(device));
    return device;
}

// open serial connection
var serial = new serialPort.SerialPort(getSerialPortDevice(), {
  baudrate: 9600
});

serial.on('open', function(error) {
    if (error) {
        console.log('RPi: Port failed to open: '+error);
    } else {
        console.log('RPi: Serial port opened');
    }

    // react to arduino sensed events
    serial.on('data', function(data) {
        console.log( 'Arduino: ' + data.toString('ascii') );
    });

    serial.on('close', function(data) {
        console.log( 'RPi: Serial port closed: ' + JSON.stringify(data) );
    });

    serial.on('error', function(error) {
        console.log( 'RPi: Serial port error: ' + JSON.stringify(error) );
    });

});

// incoming = '001:#AA44FF'
// outgoing = '^001:AA44FF\n'
var sendColor = function( colormsg ) {
    var index = colormsg.substring(0, 3);
    var colorhex = colormsg.substring(5, colormsg.length);
    colorArr[parseInt( index )] = colorhex;

    serial.write('^' + index + ':' + colorhex + '\n');
    serial.drain();
    sleep.sleep(0.05)
}

function resetColors(arr) {
    for (var i = 0; i < arr.length; i++) {
        arr[i] = '#22CCCC';
        sendColor(arr[i]);
    }
}

// set the initial state of the table
resetColors(colorArr);

//////////////////// Communication API
// 'initial_state', 'local_update' => 'remote_updates', 'remote_update'

io.on('connection', function(socket) {
    console.log('connected');

    // request for initial set of data
    socket.on('initial_state', function(data) {
        console.log('initial_state');

        socket.emit('remote_updates', fullColorSet(colorArr));
    });

    socket.on('clear_state', function(data) {
        console.log('clear_state');

        resetColors(colorArr);
        io.emit('remote_updates', fullColorSet(colorArr));
    });

    socket.on('local_update', function(colormsg) {
        console.log('local_update: ' + colormsg);
        // save state
        var ind = parseInt( colormsg.substring(0, 3) );
        colorArr[ind] = colormsg.substring(4, colormsg.length);
        
        // set color, forward to other clients
        io.emit('remote_update', colormsg);
        sendColor(msg);
    });


    socket.on('disconnect', function(data) {
        console.log("disconnected: " + JSON.stringify(data));
    });

    socket.on('error', function(data) {
        console.log("errored: " + JSON.stringify(data));
    });

});



