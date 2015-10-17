(function(){

    var colorArr     = [],
        table1       = null,
        clearbtn     = null,
        lenr         = 8,
        lenc         = 13,
        pixelSize    = 60,
        socket       = null,
        socketServer = window.location.protocol + '//rasp.com:8080';
    
    var init = function() {
        colorArr = new Array(lenr * lenc);

        // set debugging
        //localStorage.debug='*';
        localStorage.debug='';

        createTable();
        setTableDownListener();
        openConnection();
        if (socket != null) {
            setClearBtn();
            setTableUpListener();
        }
    }

    var createTable = function() {
        // set the canvas
        table1 = new fabric.Canvas('table1', {
            selection: false,
            backgroundColor : '#222222'
        });

        // add the tableIndex param to all fabric objects
        fabric.Object.prototype.tableIndex = -1;
        fabric.Object.prototype.selectedStart = -1;

        for (var y = 0; y < lenr; y++) {
            for (var x = 0; x < lenc; x++) {
                var w = pixelSize;
                var h = pixelSize;
                var offset = 4;
                var index = y*lenc + x;

                var rect = new fabric.Rect({
                    left: x*w + pixelSize,
                    top: y*h + pixelSize,
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
        console.log('table created');
    }

    // sets mouse down listeners for color squares on the table
    var setTableDownListener = function() {
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
    }

    // sets mouse up listeners for color squares on the table
    var setTableUpListener = function() {
        // emit the state of the table based on local changes
        table1.on('mouse:up', function(e) {
            if (e.target && e.target.get('tableIndex') !== -1) {
                var activeObj = e.target;

                var selectedTime = Date.now() - activeObj.selectedStart;
                // use time to determine the color of the rect
                console.log('msg sent: ' + JSON.stringify( selectedTime ));
                activeObj.set('selectedStart', -1);

                var objColor = '#FFAA33';
                // delay until received by server
                //activeObj.set('fill', objColor);
                //activeObj.opacity = 1;
                //table1.renderAll();

                var msg = pad(activeObj.get('tableIndex'), 3) + ":" + objColor;
                socket.emit('local_update', msg);
            }
        });
    }

    var setClearBtn = function() {
        clearbtn = $('#clearbtn');
        clearbtn.click(function() {
            socket.emit('clear_state', 'clearing colors');
        });
    }

    // comm API
    // 'initial_state', 'local_update' => 'remote_updates', 'remote_update'
    var openConnection = function() {
        // connect to the host server
        socket = io.connect(socketServer);

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

        socket.on('disconnect', function(msg) {
            console.log('disconnected: ' + JSON.stringify(msg));
        });
        socket.on('error', function(msg) {
            console.log('errored: ' + JSON.stringify(msg));
        });

        // get initial state of table
        socket.emit('initial_state', null);
        console.log('connection created');
    }

    // pad a with enough zeros to fill b digits
    var pad = function(a,b) {
        return (1e15+a+"").slice(-b)
    }

    if (!Date.now) {
        Date.now = function() { return new Date().getTime(); };
    }

    init();
})();
