(function(){

    var colorArr    = [],
        table1      = null,
        clearbtn    = null,
        lenr        = 8,
        lenc        = 13,
        pixelSize   = 60,
        socket      = null,
        waitModal   = null,
        playerColor = '#FFAA33',
        socketUrl   = window.location.protocol + '//rasp.net:8080';
    
    function init() {
        colorArr = new Array(lenr * lenc);

        // set debugging
        //localStorage.debug='*';
        localStorage.debug='';

        createTable();
        setTableDownListener();
        createWaitModal();
        waitModal.showPleaseWait();

        // callback executes after server returns ready response
        openConnection( function() {
            setClearBtn();
            setTableUpListener();
            waitModal.hidePleaseWait();
        });
    }

    function createTable() {
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

                var msg = pad(activeObj.get('tableIndex'), 3) + ":" + playerColor;
                socket.emit('local_update', msg);
            }
        });
    }

    function setClearBtn() {
        clearbtn = $('#clearbtn');
        clearbtn.click(function() {
            socket.emit('clear_state', 'clearing colors');
        });
    }

    // Communication API
    // 'initial_state' => 'remote_updates'
    // 'local_update', 'request_status' => 'remote_update'
    // 'request_color' => 'assign_color'
    // 'ready_request' => 'ready_response'
    function openConnection(callback) {
        // connect to the host server
        socket = io.connect(socketUrl);

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

        socket.on('assign_color', function(color) {
            if (color == null || color == '') {
                console.log('Too many players');
                alert('Too many players in the game. Please wait and refresh.');
                freezeGame();
            } else {
                playerColor = color;
            }
        });

        socket.on('ready_response', function(data) {
            // get unique user color
            socket.emit('request_color', null);
            // get initial state of table
            socket.emit('initial_state', null);
            if (callback) {
                callback();
            }
        });

        socket.on('disconnect', function(msg) {
            console.log('disconnected: ' + JSON.stringify(msg));
        });
        socket.on('error', function(msg) {
            console.log('errored: ' + JSON.stringify(msg));
        });

        socket.emit('ready_request', null);
        console.log('connection configured');
    }

    function freezeGame() {
        table1.on('mouse:up', function(e) {});
    }

    function createWaitModal() {
        waitModal = waitModal || (function () {
            var pleaseWaitDiv = $('<div class="modal hide" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false"><div class="modal-header"><h1>Connecting...</h1></div><div class="modal-body"><div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div></div></div>');
            return {
                showPleaseWait: function() {
                    pleaseWaitDiv.modal();
                },
                hidePleaseWait: function () {
                    pleaseWaitDiv.modal('hide');
                },

            };
        })();
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
