// Socket.io client to collect and send light commands to the light table
// Sits between the raspberry pi and the arduino microcontroller
//
// Bereket Abraham

var sPort = require("serialport");

// locate the arduino serial port
var port = '?';
sPort.list(function (err, ports) {
    console.log('len ports: ' + ports.length.toString() + ' | ' + err.toString());
    ports.forEach(function(p) {
        console.log('' + p.pnpId + ' | ' + p.comName);
        if (p.pnpId.indexOf('arduino') > -1) {
            port = p.comName;
        }
    });
});
console.log('Port: ' + port);
// open serial connection
var serial = new sPort.SerialPort(port, {
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

    serial.write('^001:BB11AA\n', function (err, results) {
        console.log('Wrote: ' + results.toString() + ' | ' + err.toString() );
        serial.drain(function () {
            console.log('drained');
        });
    });

});

