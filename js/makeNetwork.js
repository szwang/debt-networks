
var linkData,
    nodeData,
    nodeOrder;

var width = 1000,
    height = 900,
    nodeMin = 3;

var force, svg;
// var loading_gif = new Image();
// loading_gif.src = './assets/loading.gif'

$(document).ready(function() {
  initNetwork(yearSlider.slider('getValue'), quarterSlider.slider('getValue'));
})

function initNetwork(year, quarter) {
  $("#network").remove();
  // $("#container").append("<img id='loadingGif' src='../data/loading.gif' />")
  getNodes(year, quarter, function() {
    getLinks(year, quarter, function() {
      construct();
    })
  })
}

function construct() {

  var color = d3.scale.category10();

  var tooltip = d3.select("#chart")
    .append("div")
    .attr("class", "large-3 columns")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("opacity", 0);

  force = d3.layout.force()
    .gravity(0.05)
    .charge(-30)
    .distance(340)
    .size([width, height]);

  d3.select("svg").remove();

  svg = d3.select("#container").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "network");


  force.nodes(nodeData)
       .links(linkData);


  var link = svg.selectAll(".link")
    .data(linkData)
    .enter().append("line")
    .attr("class", "link")
    .style("stroke-width", function(d) { return Math.sqrt(Math.log(d.owed)) / 4 })
    .style("stroke", "gray")
    .style("opacity", 0.8)
    .on("mouseover", linkMouseover)

  var node = svg.selectAll(".node")
    .data(nodeData)
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", function(d) {
      return Math.sqrt(d.debt) / 25;
    })
    .style("fill", function (d) {
      return color(d.continent);
    })
    .style("opacity", 1);

  var labels = node.append("text")
    .text(function(d) { return d.name; });


  node.on("mouseover", nodeMouseover)
      .on("mousemove", moveTooltip)
      .on("mouseleave", removeTooltip)
      .call(force.drag)

  force.on("tick", function () {
    link.attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

    node.attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; });

    node.each(collide(0.7)); //Added 
  });


  force.start();

  //comment this out for force directed graph
  // for (var i = 1000; i > 0; --i) force.tick();
  // $("#loadingGif").remove();  
  // force.stop();
  
  function linkMouseover(d) {
  }

  function nodeMouseover(d) {
    var pos = d3.mouse(this);
    var linkNum;

    tooltip.html(
      "<span id='name'>" + d.name + "</span> : $" + convertToDollar(d.debt)
    )
    .style("top", (pos[1])+"px")
    .style("left",(pos[0])+"px")
    .style("z-index", 10)
    .style("opacity", .9)
    .style("font-weight", "bold")
    .style("background-color", "white")
    .style("border-color", "black")

    svg.selectAll(".link").classed("active", function(p) { 
      console.log(p, d)
      return p === d; }
      );
    svg.selectAll(".node circle").classed("active", function(p) { return p === d.source || p === d.target; });
  }

  function moveTooltip(node){
    var pos = d3.mouse(this);
    tooltip
      .style("top", (d3.event.pageY+10)+"px")
      .style("left",(d3.event.pageX+10)+"px");
  }

  function removeTooltip(node){
    tooltip
      .style("z-index",  -1)
      .style("opacity", 0)    //Make tooltip invisible
      svg.selectAll("circle")
      .transition()
      .style("opacity", 0.8);
  }

  // function mouseout() {
  //   svg.selectAll(".active").classed("active", false);
  // }
}

var padding = 1, // separation between circles
    radius = 8;

function collide(alpha) {
  var quadtree = d3.geom.quadtree(nodeData);
  return function(d) {
    var rb = 2*radius + padding,
        nx1 = d.x - rb,
        nx2 = d.x + rb,
        ny1 = d.y - rb,
        ny2 = d.y + rb;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y);
          if (l < rb) {
          l = (l - rb) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
}

function getNodes(year, quarter, callback) {
  nodeData = [];
  nodeOrder = {};

  $.getJSON('../data/nodes.json', function(allNodes) {
    _.forEach(allNodes, (val) => {
      var timeKey = constructTimeKey(year, quarter, "node");
      var debt = val[timeKey.toString()];
      if(debt !== ".." && debt !== 0 && val.iso2) {
        var data = {
          node: val.iso2,
          continent: val.continent,
          name: val["Country Name"],
          debt: debt / 1000000
        }
        nodeData.push(data);
        nodeOrder[data.node] = nodeData.length - 1;
      }
    })
    callback();
  })
}

function getLinks(year, quarter, callback) {
  linkData = [];

  console.log(nodeOrder)

  $.getJSON('../data/links.json', function(allLinks) {
    _.forEach(allLinks, (val) => {
      var timeKey = constructTimeKey(year, quarter, "link");
      var debt = val[timeKey.toString()];
      var sourceOrder = nodeOrder[val.source],
          targetOrder = nodeOrder[val.target];

      if(debt !== "NaN" && debt !== 0 && sourceOrder && targetOrder) {
        var data = {
          source: sourceOrder,
          target: targetOrder,
          owed: debt,
          sourceC: val.source,
          sourceT: val.target
        }
        linkData.push(data);
      }
    })
    callback();
  })
}

function constructTimeKey(year, quarter, type) {
  if(type === 'link') {
    return year + '-Q' + quarter;
  } else if(type === 'node') {
    var prefix = year + 'Q' + quarter;
    var suffix = "[YR" + prefix + "]";
    var key = prefix + " " + suffix;
    return key;
  }
}

function convertToDollar(num) {
  var total = num * 1000000;
  return total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


