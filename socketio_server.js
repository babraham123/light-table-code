// Socket.io server to collect and send light commands to the light table
//
// Bereket Abraham

var port = 9000
var idx = process.argv.indexOf("-p");

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
var lenr = 10;
var lenc = 15;
var colorArr = new Array(lenr * lenc);

for (var y = 0; y < lenr; y++) {
    for (var x = 0; x < lenc; x++) {
        var index = y*lenc + x;
        colorArr[index] = '#22CCCC';
    }
}

// create zero padding function
function pad(a,b){return(1e15+a+"").slice(-b)}

// comm API
// 'initial_state', 'local_update' => 'remote_updates', 'remote_update'
io.on('connection', function(socket) {
    console.log('connected');

    // initial set of data
    socket.on('initial_state', function(data) {
        //var arr = db.mycollection.find({ time_utc:{ $gt : start_time } }).toArray();
        console.log('initial_state');
        var msg = '';
        for (var i = 0; i < lenr*lenc; i++) {
            msg += pad(i, 3) + ':' + colorArr[i] + ',';
        }
        msg = msg.substring(0, msg.length-1);

        socket.emit('remote_updates', msg);
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
        socket.broadcast.emit('remote_update', colormsg);
    });


    socket.on('disconnect', function(data) {
        console.log("disconnected: " + JSON.stringify(data));
    });

    socket.on('error', function(data) {
        console.log("errored: " + JSON.stringify(data));
    });

});



