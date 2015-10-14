// LED pixel animation 
// author: Bereket Abraham


// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

// usage:
// instead of setInterval(render, 16) ....

(function animloop(){
  requestAnimFrame(animloop);
  render();
})();




var svg = d3.select("body").append("svg");
 
var square = svg.append("rect")
    .attr("height", 100)
    .attr("width", 100)
    .attr("x", 10)
    .attr("y", 10)
    .attr("fill", "green")
    .on("mouseenter", mouseEnter)
    .on("mouseleave", mouseLeave);
 
function mouseEnter() {
    square.attr("fill", "red");
}
 
function mouseLeave() {
    square.attr("fill", "blue");
}