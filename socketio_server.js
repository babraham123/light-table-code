// Socket.io server to collect and send light commands to the light table
// Sits on the raspberry pi between the client and arduino microcontroller
// 
// Bereket Abraham

var Server     = require('socket.io'),
    serialPort = require('serialport'),
    sleep      = require('sleep');

var port       = 8002,
    debug      = false, // doesn't attempt serial connection (no LEDs, only console.log)
    lenr       = 8,
    lenc       = 13,
    numLed     = lenr * lenc,
    io         = null,
    background = '#333333',
    colorArr   = null,
    serial     = null,
    colors     = ['#03B589', '#EBBA00', '#E06B0A', '#1F81DC', '#FF99FF',
                  '#3FD373', '#E2332A', '#8A38AC', '#E7ECEE', '#99CCFF'],
    users      = {},
    maxUsers   = -1,
    numUsers   = 0,
    inPlay     = false;

function init() {
    processCmdLineParams();
    colorArr = new Array(numLed);
    resetColors(background);
    shuffle(colors);

    openSocketIOConnection( function() {
        if (debug === true) {
            startGame();
        } else {
            getSerialPort( function(device) {
                openSerialConnection(device, function() {
                    startGame();
                });
            });
        }
    });
}

function startGame() {
    inPlay = true;
    io.emit('ready', null);
}

function processCmdLineParams() {
    console.log("Starting socket.io server...");
    var idx = process.argv.indexOf("--port");
    if (idx >= 0 && idx < process.argv.length-1) {
        port = parseInt( process.argv[idx + 1] );
        console.log("Port " + port.toString());
    }
    idx = process.argv.indexOf("--row");
    if (idx >= 0 && idx < process.argv.length-1) {
        lenr = parseInt( process.argv[idx + 1] );
        console.log("Number of rows: " + lenr.toString());
    }
    idx = process.argv.indexOf("--col");
    if (idx >= 0 && idx < process.argv.length-1) {
        lenc = parseInt( process.argv[idx + 1] );
        console.log("Number of columns: " + lenc.toString());
    }
    idx = process.argv.indexOf("--num-led");
    if (idx >= 0 && idx < process.argv.length-1) {
        numLed = parseInt( process.argv[idx + 1] );
        console.log("Number of LEDs in chain: " + numLed.toString());
    } else {
        numLed = lenr * lenc;
    }
    idx = process.argv.indexOf("--debug");
    if (idx >= 0 && idx < process.argv.length) {
        debug = true;
        console.log("Debug mode");
    }
}

function getSerialPort(callback) {
    var portInterval; 
    // retry every .5s
    portInterval = setInterval(function() {
        var device = getSerialPortDevice();
        if (device) {
            console.log('Device: ' + JSON.stringify(device));
            window.clearInterval(portInterval);
            callback(device);
        }
    }, 500);
}

function getSerialPortDevice() {
    // '/dev/ttyACM0'
    var device = null;
    serialPort.list(function (err, ports) {
        if (ports) {
            ports.forEach(function(p) {
                if (p.pnpId.indexOf('arduino') > -1) {
                    device = p.comName;
                }
            });
        }
    });

    return device;
}

function openSerialConnection(device, callback) {
    serial = new serialPort.SerialPort(device, {
      baudrate: 9600
    });

    serial.on('open', function(error) {
        if (error) {
            throw 'RPi: Port failed to open: '+error;
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
        if (callback) {
            callback();
        }
    });
}

// Communication API
// 'initial_state' => 'remote_updates'
// 'local_update' => 'remote_update'
// 'color_request' => 'assign_color'
// 'status_request' => 'ready', 'not_ready'
function openSocketIOConnection(callback) {
    console.log('Starting socket.io server...');
    io = new Server(port);
    io.on('connection', function(socket) {
        // request for initial set of data
        socket.on('initial_state', function(data) {
            parseMessage(socket, data, 'initial_state', '');
        });
        // clear all of the leds
        socket.on('clear_state', function(data) {
            parseMessage(socket, data, 'clear_state', '');
        });
        // update the color of a particular led
        socket.on('local_update', function(data) {
            parseMessage(socket, data, 'local_update', data);
        });
        // request a color by user
        socket.on('color_request', function(data) {
            parseMessage(socket, data, 'color_request', ', player ' + socket.id.toString());
        });
        // request a ready notification
        socket.on('status_request', function(data) {
            parseMessage(socket, data, 'status_request', '');
        });

        socket.on('disconnect', function(data) {
            console.log("disconnected: " + JSON.stringify(data));
            releaseUser(socket.id);
        });
        socket.on('error', function(data) {
            console.log("errored: " + JSON.stringify(data));
        });
        console.log('connected');
    });
    if (callback) {
        callback();
    }
}

function parseMessage(socket, data, mtype, addon) {
    var addon = addon || '';
    console.log(mtype + ': ' + addon);
    if (inPlay === false) {
        socket.emit('not_ready', null);
        return;
    }

    switch(mtype) {
        case 'initial_state':
            socket.emit('remote_updates', getFullColorSet());
            break;
        case 'clear_state':
            resetColors(background);
            sendAll();
            io.emit('remote_updates', getFullColorSet());
            break;
        case 'local_update':
            io.emit('remote_update', data);
            sendAndSaveColor(data);
            break;
        case 'color_request':
            var color = assignColorByUser(socket.id);
            if (color) {
                socket.emit('assign_color', color);
            } else {
                socket.emit('not_ready', null);
            }
            break;
        case 'status_request':
            socket.emit('ready', null);
            break;
        default:
            throw 'Message type not found';
            break;
    }
}

function assignColorByUser(id) {
    if (users.hasOwnProperty(id) && users[id]) {
        return users[id];
    }
    numUsers++;
    if (maxUsers > -1 && numUsers > maxUsers) {
        return null;
    }
    var color = colors[numUsers % colors.length];
    users[id] = color;
    console.log('Player ' + id.toString() + ' received color ' + color);
    return color;
}

function releaseUser(id) {
    numUsers--;
    delete users[id];
    console.log('Player ' + id.toString() + ' disconnected');
}

// incoming = '001:#AA44FF'
// outgoing = '^001:AA44FF\n'
// ignore message if out-of-bounds
// don't send over serial if debug mode
function sendAndSaveColor(colormsg) {
    if (debug === true) {
        console.log(colormsg);
    }
    var index = parseInt( colormsg.substring(0, 3) );
    var colorhex = colormsg.substring(5, colormsg.length);

    if (index < numLed) {
        colorArr[index] = '#' + colorhex;
        if (debug === false) {
            serial.write('^' + index.toString() + ':' + colorhex + '\n');
            serial.drain();
            sleep.sleep(0.02);
        }
    }
}

function getColor(ind) {
    ind = parseInt(ind);
    var msg = background;
    if (ind < numLed) {
        msg = colorArr[ind];
    }
    return ind.toString() + ':' + msg;
}

function resetColors(color) {
    for (var i = 0; i < colorArr.length; i++) {
        colorArr[i] = color;
    }
}

function sendAll() {
    for (var i = 0; i < colorArr.length; i++) {
        var msg = pad(i, 3) + ':' + colorArr[i];
        sendAndSaveColor(msg);
    }
}

// zero padding a to b places
function pad(a,b) {
    return(1e15+a+"").slice(-b)
}

function getFullColorSet() {
    var msg = '';
    for (var i = 0; i < colorArr.length; i++) {
        msg += pad(i, 3) + ':' + colorArr[i] + ',';
    }
    msg = msg.substring(0, msg.length-1);
    return msg;
}

// Fisher-Yates shuffle
function shuffle(arr) {
  var i = 0, j = 0, temp = null;
  for (i = arr.length - 1; i > 0; i -= 1) {
    j = Math.floor(Math.random() * (i + 1));
    temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
}

init();

