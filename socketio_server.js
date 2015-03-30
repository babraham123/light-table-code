// Socket.io server to collect and send light commands to the light table
//
// Bereket Abraham

var port = 8002
var idx = process.argv.indexOf("--port");

if (idx >= 0 && idx < process.argv.length) {
    port = parseInt( process.argv[idx + 1] );
}
console.log(JSON.stringify(process.argv));

//var mongojs = require('mongojs');
var io      = require('socket.io').listen(port);

// connect to mongo db server
//var db = mongojs('mydb', ['lightTables']);
//var db = mongojs('username:password@localhost/mydb', ['lightTables']);

// initialize table values, array to hold light values
var lenr = 8;
var lenc = 13;
var colorArr = new Array(lenr * lenc);

function resetColors(arr) {
    for (var i = 0; i < arr.length; i++) {
        arr[i] = '#22CCCC';
    }
}

resetColors(colorArr);

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

//io.set('transports', ['websocket']);
//io.set('log level', 1);

// comm API
// 'initial_state', 'local_update' => 'remote_updates', 'remote_update'
io.on('connection', function(socket) {
    console.log('connected');

    // request for initial set of data
    socket.on('initial_state', function(data) {
        //var arr = db.mycollection.find({ time_utc:{ $gt : start_time } }).toArray();
        console.log('initial_state');

        socket.emit('remote_updates', fullColorSet(colorArr));
    });

    socket.on('clear_state', function(data) {
        // save data in db
        console.log('clear_state');

        resetColors(colorArr);
        io.emit('remote_updates', fullColorSet(colorArr));
    });

    socket.on('local_update', function(colormsg) {
        /*
        var entry = {color: colormsg, time_utc: new Date().getTime()}; 
        db.lightTables.save(entry, function(err, saved) {
            if( err || !saved ) {
                console.log("Result not saved");
            } else {
                console.log(entry);
            }
        });
        */
        console.log('local_update: ' + colormsg);
        // save state
        var ind = parseInt( colormsg.substring(0, 3) );
        colorArr[ind] = colormsg.substring(4, colormsg.length);
        
        // set color, forward to controller
        //socket.broadcast.emit('remote_update', colormsg);
        io.emit('remote_update', colormsg);
    });


    socket.on('disconnect', function(data) {
        console.log("disconnected: " + JSON.stringify(data));
    });

    socket.on('error', function(data) {
        console.log("errored: " + JSON.stringify(data));
    });

});



