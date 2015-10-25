(function(){

    var colorArr      = [],
        table1        = null,
        clearbtn      = null,
        lenr          = 8,
        lenc          = 13,
        numLed        = lenr * lenc,
        pixelSize     = 60,
        socket        = null,
        pleaseWaitDiv = null,
        playerColor   = '#FFAA33',
        background    = '#333333',
        socketUrl     = window.location.protocol + '//rasp.net:8080';
    
    function init() {
        colorArr = new Array(numLed);
        // set debugging
        localStorage.debug='';  // '*'

        createTable();
        setTableDownListener();
        pleaseWaitDiv = $('#pleaseWaitDialog');
        pleaseWaitDiv.modal('show');

        openConnection();
        setClearBtn();
        setTableUpListener();
    }

    function createTable() {
        // set the canvas
        table1 = new fabric.Canvas('table1', {
            selection: false,
            backgroundColor : '#000000'
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
                if (index >= numLed) {
                    continue;
                }

                var rect = new fabric.Rect({
                    left: x*w + pixelSize,
                    top: y*h + pixelSize,
                    fill: background,
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
    function setTableDownListener() {
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
    function setTableUpListener() {
        // emit the state of the table based on local changes
        table1.on('mouse:up', function(e) {
            if (e.target && e.target.get('tableIndex') !== -1) {
                var activeObj = e.target;

                var selectedTime = Date.now() - activeObj.selectedStart;
                // use time to determine the color of the rect
                console.log('msg sent: ' + JSON.stringify( selectedTime ));
                activeObj.set('selectedStart', -1);
                // '001:#AA44FF'
                var msg = pad(activeObj.get('tableIndex'), 3) + ":" + playerColor;
                if (socket) {
                    socket.emit('local_update', msg);
                }
            }
        });
    }

    function setClearBtn() {
        clearbtn = $('#clearbtn');
        clearbtn.click(function() {
            if (socket) {
                socket.emit('clear_state', null);
            }
        });
    }

    // Communication API
    // 'initial_state' => 'remote_updates'
    // 'local_update', 'request_status' => 'remote_update'
    // 'request_color' => 'assign_color'
    // 'status_request' => 'ready', 'not_ready'
    function openConnection() {
        // connect to the host server
        socket = io.connect(socketUrl);

        socket.on('remote_update', function(data) {
            console.log('remote_update: ' + data);
            setColor(data);
            table1.renderAll();            
        });

        socket.on('remote_updates', function(msg) {
            // set the initial state of the table
            var initialColors = msg.split(',');
            $.each(initialColors, function( index, elem ) {
                setColor(elem);
            });
            table1.renderAll();
        });

        socket.on('assign_color', function(color) {
            playerColor = color;
        });

        socket.on('ready', function(data) {
            socket.emit('color_request', null);
            socket.emit('initial_state', null);
            pleaseWaitDiv.modal('hide');
        });

        socket.on('not_ready', function(data) {
            pleaseWaitDiv.modal('show');
        });

        socket.on('disconnect', function(msg) {
            console.log('disconnected: ' + JSON.stringify(msg));
        });
        socket.on('error', function(msg) {
            console.log('errored: ' + JSON.stringify(msg));
        });

        socket.emit('status_request', null);
        console.log('connection configured');
    }

    function setColor(colormsg) {
        var ind = parseInt( colormsg.substring(0, 3) );
        var color = colormsg.substring(4, colormsg.length);
        if (ind < numLed) {
            colorArr[ind].set('fill', color);
            colorArr[ind].set('opacity', 1);
        }
    }

    function freezeGame() {
        table1.on('mouse:up', function(e) {});
    }

    // pad a with enough zeros to fill b digits
    function pad(a,b) {
        return (1e15+a+"").slice(-b)
    }

    if (!Date.now) {
        Date.now = function() { return new Date().getTime(); };
    }

    init();
})();
