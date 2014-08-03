var SerialPort = require("serialport").SerialPort;

var serial = new SerialPort('/dev/ttyACM0');

serial.on('open', function() {
    console.log('Serial Port Opened');

    serial.on('data', function(data){
        console.log(data[0]);
    });

    serial.emit('data', 23);
    serial.emit('data', [42]);
});

