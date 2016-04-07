
var links = [],
    nodes = [],
    nodeOrder = {};

//defaults
var year = 2015,
    quarter = 2;

var width = 1000,
    height = 1000,
    nodeMin = 3;

var force, svg, OP;
// var loading_gif = new Image();
// loading_gif.src = './assets/loading.gif'

$(document).ready(function() {
  getNodes(year, quarter, function() {
    getLinks(year, quarter, function() {
      construct();
    })
  })
})


function construct() {
  var color = d3.scale.category10();

  var force = d3.layout.force()
      .gravity(0.05)
      .charge(-100)
      .distance(300)
      .size([width, height]);

  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);

  console.log(nodes, links)

  force.nodes(nodes)
       .links(links)
       .start();

  var link = svg.selectAll(".link")
    .data(links)
    .enter().append("line")
    .attr("class", "link")
    .style("stroke-width", .6)
    .style("stroke", "gray")
    .style("opacity", 0.8)
    .on("mouseover", linkMouseover)

  var node = svg.selectAll(".node")
    .data(nodes)
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", function(d) {
      return Math.sqrt(Math.sqrt(d.debt));
    })
    .style("fill", function (d) {
      return color(d.continent);
    })
    .call(force.drag)

  node.append("text")
    .attr("dx", 12)
    .attr("dy", ".35em")
    .text(function(d) { return d.name });

  node.on("mouseover", nodeMouseover);

  force.on("tick", function () {
    link.attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

    node.attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; });

    node.each(collide(0.5)); //Added 
  });
  
  function linkMouseover(d) {
    // svg.selectAll(".link").classed("active", function(p) { return p === d});
    // svg.selectAll(".node circle").classed("active", function(p) { return p === d});
    var info = [d.source, d.target],
        source = d.source.node,
        target = d.target.node;

    _.forEach(links, function(val) {
      if(source === val.source && target === val.target) {
        info.push(val);
      } else if(target === val.source && source === val.target) {
        info.push(val);
      }
    })
    
    setTimeout(function() { console.log(info) }, 2000)
  }


  function nodeMouseover(d) {
    console.log(d.name, d.debt);
  }

  function mouseout() {
    svg.selectAll(".active").classed("active", false);
  }
}

var padding = 1, // separation between circles
    radius = 8;

function collide(alpha) {
  var quadtree = d3.geom.quadtree(nodes);
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
        nodes.push(data);
        nodeOrder[data.node] = nodes.length - 1;
      }
    })
    callback();
  })
}

function getLinks(year, quarter, callback) {
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
          owed: debt
        }
        links.push(data);
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

