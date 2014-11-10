(function(){

    var _self = this;
    var colorArr = [];
    var table1 = null;
    var clearbtn = null;
    var lenr = 10;
    var lenc = 15;
    var socketServer = window.location.protocol + '//bereketabraham.com:8080'; // '//192.168.1.6:8080';

    var pad = function(a,b) {
        return (1e15+a+"").slice(-b)
    }

    if (!Date.now) {
        Date.now = function() { return new Date().getTime(); };
    }
    
    var init = function() {
        // set the canvas
        table1 = new fabric.Canvas('table1', {
            selection: false,
            backgroundColor : '#222222'
        });

        // set debugging
        //localStorage.debug='*';
        localStorage.debug='';

        clearbtn = $('#clearbtn');

        tableSetup();
        connectionSetup();
    }

    var tableSetup = function() {
        // set array of rects
        colorArr = new Array(lenr * lenc);
        // add the tableIndex param to all fabric objects
        fabric.Object.prototype.tableIndex = -1;
        fabric.Object.prototype.selectedStart = -1;

        for (var y = 0; y < lenr; y++) {
            for (var x = 0; x < lenc; x++) {
                var w = 40;
                var h = 40;
                var offset = 3;
                var index = y*lenc + x;

                var rect = new fabric.Rect({
                    left: x*w + 40,
                    top: y*h + 40,
                    fill: '#CCCCCC',
                    width: w - offset,
                    height: h - offset,
                    hasControls: false,
                    hasBorders: false,
                    lockMovementX: true,
                    lockMovementY: true,
                    //selectable: false,
                    perPixelTargetFind: true,
                    targetFindTolerance: offset,
                    tableIndex: index
                });
                colorArr[index] = rect;

                table1.add(rect);
            }
        }

        table1.on({
            'object:selected': function(e) {     // 'mouse:down'
                if (e.target && e.target.get('tableIndex') !== -1) {
                    e.target.opacity = 0.5;
                    e.target.selectedStart = Date.now();

                    console.log('mouse down: ' + pad(e.target.get('tableIndex'), 3));
                    //table1.renderAll();
                }
            }
        });

        console.log('table created');
    }

    // comm API
    // 'initial_state', 'local_update' => 'remote_updates', 'remote_update'
    var connectionSetup = function() {
        // connect to the host server
        var socket = io.connect(socketServer);

        console.log('connection created');

        socket.on('remote_update', function(colormsg) {
            console.log('remote_update: ' + colormsg);

            // update the state of the table based on remote change
            var ind = parseInt( colormsg.substring(0, 3) );
            var color = colormsg.substring(4, colormsg.length);
            
            colorArr[ind].set('fill', color);
            colorArr[ind].set('opacity', 1);
            table1.renderAll();            
        });

        socket.on('remote_updates', function(msg) {
            console.log('remote_updates: ' + msg);

            // set the initial state of the table
            var initialColors = msg.split(',');
            $.each(initialColors, function( index, elem ) {
                var ind = parseInt( elem.substring(0, 3) );
                var color = elem.substring(4, elem.length);
                colorArr[ind].set('fill', color);
            });
            table1.renderAll();
        });

        // emit the state of the table based on local changes
        table1.on('mouse:up', function(e) {
            if (e.target && e.target.get('tableIndex') !== -1) {
                var activeObj = e.target;

                var selectedTime = Date.now() - activeObj.selectedStart;
                // use time to determine the color of the rect
                console.log(JSON.stringify( selectedTime ));
                activeObj.set('selectedStart', -1);

                var objColor = '#FFAA33';
                // delay until received by server
                //activeObj.set('fill', objColor);
                //activeObj.opacity = 1;
                //table1.renderAll();

                var msg = pad(activeObj.get('tableIndex'), 3) + ":" + objColor;
                socket.emit('local_update', msg);
                console.log('msg sent');
            }
        });

        clearbtn.click(function() {
            socket.emit('clear_state', 'clearing colors...');
        });

        socket.on('disconnect', function(msg) {
            console.log('disconnected: ' + JSON.stringify(msg));
        });

        socket.on('error', function(msg) {
            console.log('errored: ' + JSON.stringify(msg));
        });

        // get initial state of table
        socket.emit('initial_state', null);

    }

    init();
})();
