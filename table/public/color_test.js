(function(){

    var _self = this;
    var table1 = null;
    var rect1 = null;
    var rect2 = null;
    var hexsym = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];
    var MAXCOLOR = parseInt('FFFFFF', 16);

    if (!Date.now) {
        Date.now = function() { return new Date().getTime(); };
    }

    var hexToStr = function(hex) {
        var ss = hex.toString(16).toUpperCase();
        if(ss.length < 2) {
            ss = '0' + ss;
        }
        return ss;
    }

    var setColorFromTime1 = function(time, oldcolor) {
        var newcolor = ''
        oldcolor = oldcolor.substring(1, oldcolor.length);
        var colhex = parseInt(oldcolor, 16);

        colhex = (colhex + time) % MAXCOLOR;
        newcolor = hexToStr(colhex);
        console.log('color from time: ' + newcolor);
        return '#' + newcolor;
    }

    var setColorFixed = function(oldcolor) {
        var newcolor = ''
        oldcolor = oldcolor.substring(1, oldcolor.length);
        for(var i = 0; i < 6; i+=2) {
            var colstr = oldcolor.substring(i,i+2);
            var colhex = parseInt(colstr, 16);

            colhex = (colhex + 16) % 255;
            newcolor += hexToStr(colhex);
        }
        console.log('color set beat: ' + newcolor);
        return '#' + newcolor;
    }

    // set the canvas
    table1 = new fabric.Canvas('table1', {
        selection: false,
        backgroundColor : '#222222'
    });

    fabric.Object.prototype.selectedStart = -1;

    rect1 = new fabric.Rect({
        left: 30,
        top: 30,
        fill: '#BBBBBB',
        width: 300,
        height: 300,
        hasControls: false,
        hasBorders: false,
        lockMovementX: true,
        lockMovementY: true,
        //selectable: false,
        perPixelTargetFind: true,
        targetFindTolerance: 10,
        selectedStart: -1,
        tableIndex: 1
    });
    table1.add(rect1);

    rect2 = new fabric.Rect({
        left: 360,
        top: 30,
        fill: '#DDDDDD',
        width: 300,
        height: 300,
        hasControls: false,
        hasBorders: false,
        lockMovementX: true,
        lockMovementY: true,
        //selectable: false,
        perPixelTargetFind: true,
        targetFindTolerance: 10,
        selectedStart: -1,
        tableIndex: 2
    });
    table1.add(rect2);

    table1.on({
        'object:selected': function(e) {     // 'mouse:down'
            if (e.target) {
                e.target.opacity = 0.5;
                e.target.selectedStart = Date.now();

                console.log('mouse down');
                table1.renderAll();
            }
        }
    });

    table1.on('mouse:up', function(e) {
        if (e.target && e.target.get('tableIndex') === 1) {
            var activeObj = e.target;

            var selectedTime = Date.now() - activeObj.selectedStart;
            // use time to determine the color of the rect
            console.log('mouse up: ' + JSON.stringify( selectedTime ));
            activeObj.set('selectedStart', -1);

            var newcolor = setColorFromTime1(selectedTime, activeObj.get('fill'));
            activeObj.set('fill', newcolor);
            activeObj.opacity = 1;
            table1.renderAll();

        }
    });

    var colorStepper = setInterval(function() {
      var nextcolor = setColorFixed(rect2.get('fill'));
      rect2.set('fill', nextcolor);
      table1.renderAll();
    }, 1000);

})();


