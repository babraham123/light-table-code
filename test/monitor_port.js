// Socket.io client to collect and send light commands to the light table
// Sits between the raspberry pi and the arduino microcontroller
//
// Bereket Abraham

var serialPort = require("serialport");

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

    serial.write('ltable is awesome', function (err, results) {
        console.log('Wrote: ' + err+results);
        serial.drain(function () {
            console.log('drained');
        });
    });

});

