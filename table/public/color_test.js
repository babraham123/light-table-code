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

    var hexToColor = function(hex) {
        var ss = hex.toString(16).toUpperCase();
        while(ss.length < 6) {
            ss = '0' + ss;
        }
        return '#' + ss;
    }

    var rollWithOdds = function(odds) {
        var r = Math.floor( Math.random() * odds);
        return (r === 0);
    }

    var setColorByValue = function(oldcolor, adder) {
        var newcolor = '';
        oldcolor = oldcolor.substring(1, oldcolor.length);
        var colhex = parseInt(oldcolor, 16);

        colhex = (colhex + adder) % MAXCOLOR;
        newcolor = hexToColor(colhex);
        //console.log('color from time: ' + newcolor);
        return newcolor;
    }

    var scrambleColors = function(color) {
        var colorArr = ['', '', ''];
        colorArr[0] = color.substring(1,3);
        colorArr[1] = color.substring(3,5);
        colorArr[2] = color.substring(5);

        var indices = generateRandomRangeUnique(colorArr.length);
        color = '#';
        for (var j = 0; j < indices.length; j++) {
            color = color + colorArr[indices[j]];
        }
        return color;
    }

    var generateRandomRangeUnique = function(size) {
        var used = [];
        var current;
        for (var i = 0; i < size; i++) {
            while ( used.indexOf(current = (Math.floor(Math.random() * size))) != -1 );
            used.push(current);
        }
	return used;
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
        fill: '#000000',
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
        fill: '#000000',
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
    /*
    table1.on({
        'object:selected': function(e) {     // 'mouse:down'
            if (e.target) {
                e.target.opacity = 0.5;
                e.target.selectedStart = Date.now();

                //console.log('mouse down');
                table1.renderAll();
            }
        }
    });
    */

    table1.on('mouse:down', function(e) {
        if (e.target && e.target.get('selectedStart') === -1) {
           var activeObj = e.target;
           activeObj.opacity = 0.5;
           activeObj.selectedStart = Date.now();

           //console.log('mouse down');
           table1.renderAll();
       }
    });

    table1.on('mouse:up', function(e) {
        if (e.target && e.target.get('selectedStart') > -1) {
            var activeObj = e.target;

            var selectedTime = Date.now() - activeObj.selectedStart;
            // use time to determine the color of the rect
            activeObj.set('selectedStart', -1);

	    if (activeObj.tableIndex === 1) {
                var newcolor = setColorByValue(activeObj.get('fill'), selectedTime * 10);
            } else if (activeObj.tableIndex === 2) {
                var newcolor = setColorByValue(activeObj.get('fill'), 500);
	    } else {
		var newcolor = "#FF33AA";
	    }

	    newcolor = scrambleColors(newcolor);
	    activeObj.set('fill', newcolor);
            activeObj.set('opacity', 1);
            console.log('color: ' + newcolor + ' | mouse up: ' + JSON.stringify( selectedTime ));
            
            table1.renderAll();
        }
    });

})();

