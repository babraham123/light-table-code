(function(){

    var _self = this;
    var colorset = [];
    var table1 = null;
    var clearbtn = null;
    var lenr = 10;
    var lenc = 15;
    var width_table = 750;
    var height_table = 500;
    var width_box = 40;
    var offset_box = 3;
    var socketServer = window.location.protocol + '//bereketabraham.com:8080'; // '//192.168.1.6:8080';

    // pad a with enough zeros to fill b digits
    var pad = function(a,b) {
        return (1e15+a+"").slice(-b)
    }

    if (!Date.now) {
        Date.now = function() { return new Date().getTime(); };
    }
    
    var init = function() {
        //Create SVG element
        var table1 = d3.select("#table1")
            .append("svg")
            .attr("width", width_table)
            .attr("height", height_table);

        // set debugging
        //localStorage.debug='*';
        localStorage.debug='';

        clearbtn = $('#clearbtn');

        tableSetup();
        connectionSetup();
    }


    var tableSetup = function() {
        // set of squares
        colorset = new Array(lenr * lenc);

        for (var y = 0; y < lenr; y++) {
            for (var x = 0; x < lenc; x++) {
                var index = y*lenc + x;
                // [left, top, color]
                colorset[index] = [(x+1)*width_box, (y+1)*width_box, '#CCCCCC'];
                // dim = width_box - offset
            }
        }

        svg.selectAll("rect")
            .data(dataset)
            .enter()
            .append("rect")
            .attr("x", function(d, i) {
                return d[0];
            })
            .attr("y", function(d, i) {
                return d[1];
            })
            .attr("width", width_box - offset)
            .attr("height", width_box - offset)
            .attr("fill", function(d) {
                return d[2];
            });

    }

    var connectionSetup = function() {
        //
    }

    init();
})();