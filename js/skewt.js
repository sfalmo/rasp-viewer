import * as d3 from 'd3';

var SkewT = function(div) {
    //properties used in calculations
    var wrapper = d3.select(div);
    var width = parseInt(wrapper.style('width'), 10);
    var height = width; //tofix
    var margin = {top: 10, right: 50, bottom: 20, left: 40}; //container margins
    var deg2rad = (Math.PI/180);
    var tan = Math.tan(55*deg2rad);
    var basep = 1050;
    var topp = 250;
    var plines = [1000,850,700,500,300,200];
    var pticks = [950,900,800,750,650,600,550,450,400,350,250];
    var barbsize = 20;
    // functions for Scales and axes. Note the inverted domain for the y-scale: bigger is up!
    var r = d3.scaleLinear().range([0,300]).domain([0,150]);
    var y2 = d3.scaleLinear();
    var bisectTemp = d3.bisector(function(d) { return d.press; }).left; // bisector function for tooltips
    var w, h, x, y, xAxis, yAxis, yAxis2;
    var data = [];
    //aux
    var unit = "m/s"; // or kmh

    //containers
    var svg = wrapper.append("svg").attr("id", "svg");	 //main svg
    var container = svg.append("g").attr("id", "container"); //container
    var skewtbg = container.append("g").attr("id", "skewtbg");//background
    var skewtgroup = container.append("g"); // put skewt lines in this group
    var barbgroup = container.append("g")
        .style("stroke", "#000")
        .style("stroke-width", "1px")
        .style("fill", "none");

    //local functions
    function setVariables() {
        width = parseInt(wrapper.style('width'), 10);
        height = parseInt(wrapper.style('height'), 10);
        w = width - margin.left - margin.right;
        h = height - margin.top - margin.bottom;
        x = d3.scaleLinear().range([0, w]).domain([-45,50]);
        y = d3.scaleLog().range([0, h]).domain([topp, basep]);
        xAxis = d3.axisBottom(x).tickSize(0,0).ticks(10);
        yAxis = d3.axisLeft(y).tickSize(0,0).tickValues(plines).tickFormat(d3.format(".0d"));
        yAxis2 = d3.axisRight(y).tickSize(5,0).tickValues(pticks);
    }

    function convert(msvalue, unit) {
        switch(unit) {
        case "kt":
            return msvalue*1.943844492;
            break;
        case "kmh":
            return msvalue*3.6;
            break;
        default:
            return msvalue;
        }
    }

    //assigns d3 events
    d3.select(window).on('resize', resize);

    function resize() {
        skewtbg.selectAll("*").remove();
        setVariables();
        svg.attr("width", w + margin.right + margin.left).attr("height", h + margin.top + margin.bottom);
        container.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        drawBackground();
        makeBarbTemplates();
        plot(data);
    }

    var drawBackground = function() {
        // Add clipping path
        skewtbg.append("clipPath")
            .attr("id", "clipper")
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", w)
            .attr("height", h);

        // Skewed temperature lines
        skewtbg.selectAll("templine")
            .data(d3.range(-100,50,10))
            .enter().append("line")
            .attr("x1", function(d) { return x(d)-0.5 + (y(basep)-y(topp))/tan; })
            .attr("x2", function(d) { return x(d)-0.5; })
            .attr("y1", 0)
            .attr("y2", h)
            .style("stroke", "#aaa")
            .style("fill", "none")
            .style("stroke-width", function(d) { return d == 0 ? "1.25px" : "0.75px"; })
            .attr("clip-path", "url(#clipper)");

        // Logarithmic pressure lines
        skewtbg.selectAll("pressureline")
            .data(plines)
            .enter().append("line")
            .attr("x1", 0)
            .attr("x2", w)
            .attr("y1", function(d) { return y(d); })
            .attr("y2", function(d) { return y(d); })
            .style("stroke", "#aaa")
            .style("fill", "none")
            .style("stroke-width", "0.75px");

        // create array to plot dry adiabats
        var pp = d3.range(topp,basep+1,10);
        var dryad = d3.range(-30,240,20);
        var all = [];
        for (var i=0; i<dryad.length; i++) {
            var z = [];
            for (var j=0; j<pp.length; j++) { z.push(dryad[i]); }
            all.push(z);
        }

        var dryline = d3.line()
            .curve(d3.curveBasis)
            .x(function(d,i) { return x( ( 273.15 + d ) / Math.pow( (1000/pp[i]), 0.286) -273.15) + (y(basep)-y(pp[i]))/tan;})
            .y(function(d,i) { return y(pp[i]); } );

        // Draw dry adiabats
        skewtbg.selectAll("dryadiabatline")
            .data(all)
            .enter().append("path")
            .style("stroke", "#aaa")
            .style("fill", "none")
            .style("stroke-width", "0.75px")
            .attr("clip-path", "url(#clipper)")
            .attr("d", dryline);

        // Line along right edge of plot
        skewtbg.append("line")
            .attr("x1", w-0.5)
            .attr("x2", w-0.5)
            .attr("y1", 0)
            .attr("y2", h)
            .style("stroke", "#aaa")
            .style("fill", "none")
            .style("stroke-width", "0.75px");

        // Add axes
        skewtbg.append("g").attr("transform", "translate(0," + (h-0.5) + ")").call(xAxis);
        skewtbg.append("g").attr("transform", "translate(-0.5,0)").call(yAxis);
        skewtbg.append("g").attr("transform", "translate(-0.5,0)").call(yAxis2).selectAll("text").style("display", "none");
    };

    var makeBarbTemplates = function(){
        var speeds = d3.range(5,105,5);
        var barbdef = container.append('defs');
        speeds.forEach(function(d) {
            var thisbarb = barbdef.append('g').attr('id', 'barb'+d);
            var flags = Math.floor(d/50);
            var pennants = Math.floor((d - flags*50)/10);
            var halfpennants = Math.floor((d - flags*50 - pennants*10)/5);
            var px = barbsize;
            // Draw wind barb stems
            thisbarb.append("line").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", barbsize);
            // Draw wind barb flags and pennants for each stem
            for (var i=0; i<flags; i++) {
                thisbarb.append("polyline")
                    .attr("points", "0,"+px+" -10,"+(px)+" 0,"+(px-4))
                    .style("fill", "#000");
                px -= 7;
            }
            // Draw pennants on each barb
            for (i=0; i<pennants; i++) {
                thisbarb.append("line")
                    .attr("x1", 0)
                    .attr("x2", -10)
                    .attr("y1", px)
                    .attr("y2", px+4);
                px -= 3;
            }
            // Draw half-pennants on each barb
            for (i=0; i<halfpennants; i++) {
                thisbarb.append("line")
                    .attr("x1", 0)
                    .attr("x2", -5)
                    .attr("y1", px)
                    .attr("y2", px+2);
                px -= 3;
            }
        });
    };

    var drawToolTips = function(skewtlines) {
        var lines = skewtlines.reverse();
        // Draw tooltips
        var tmpcfocus = skewtgroup.append("g").style("fill", "red").style("stroke", "none").style("display", "none");
        tmpcfocus.append("circle").attr("r", 4);
        tmpcfocus.append("text").attr("x", 9).attr("dy", ".35em");

        var dwpcfocus = skewtgroup.append("g").style("fill", "green").style("stroke", "none").style("display", "none");
        dwpcfocus.append("circle").attr("r", 4);
        dwpcfocus.append("text").attr("x", -9).attr("text-anchor", "end").attr("dy", ".35em");

        var hghtfocus = skewtgroup.append("g").style("display", "none");
        hghtfocus.append("text").attr("x", 0).attr("text-anchor", "start").attr("dy", ".35em");

        var wspdfocus = skewtgroup.append("g").style("display", "none");
        wspdfocus.append("text").attr("x", 0).attr("text-anchor", "start").attr("dy", ".35em");

        container.append("rect")
            .style("fill", "none")
            .style("pointer-events", "all")
            .attr("width", w)
            .attr("height", h)
            .on("mouseover", function() { tmpcfocus.style("display", null); dwpcfocus.style("display", null); hghtfocus.style("display", null); wspdfocus.style("display", null);})
            .on("mouseout", function() { tmpcfocus.style("display", "none"); dwpcfocus.style("display", "none"); hghtfocus.style("display", "none"); wspdfocus.style("display", "none");})
            .on("mousemove", function (event, datum) {
                var y0 = y.invert(d3.pointer(event)[1]); // get y value of mouse pointer in pressure space
                var i = bisectTemp(lines, y0, 1, lines.length-1);
                var d0 = lines[i - 1];
                var d1 = lines[i];
                var d = y0 - d0.press > d1.press - y0 ? d1 : d0;
                tmpcfocus.attr("transform", "translate(" + (x(d.temp) + (y(basep)-y(d.press))/tan)+ "," + y(d.press) + ")");
                dwpcfocus.attr("transform", "translate(" + (x(d.dwpt) + (y(basep)-y(d.press))/tan)+ "," + y(d.press) + ")");
                hghtfocus.attr("transform", "translate(0," + y(d.press) + ")");
                tmpcfocus.select("text").text(Math.round(d.temp)+"°C");
                dwpcfocus.select("text").text(Math.round(d.dwpt)+"°C");
                hghtfocus.select("text").text("- "+Math.round(d.hght)+" m");   //hgt or hghtagl ???
                wspdfocus.attr("transform", "translate(" + (w-65)  + "," + y(d.press) + ")");
                wspdfocus.select("text").text(Math.round(convert(d.wspd, unit)*10)/10 + " " + unit);
            });
    };

    var plot = function(s){
        data = s;
        skewtgroup.selectAll("path").remove(); //clear previous paths from skew
        barbgroup.selectAll("use").remove(); //clear previous paths from barbs

        if(data.length==0) return;

        //skew-t stuff
        var skewtline = data.filter(function(d) { return (d.temp > -1000 && d.dwpt > -1000); });
        var skewtlines = [];
        skewtlines.push(skewtline);

        var templine = d3.line().curve(d3.curveBasis).x(function(d,i) { return x(d.temp) + (y(basep)-y(d.press))/tan; }).y(function(d,i) { return y(d.press); });
        var tempLines = skewtgroup.selectAll("templines")
            .data(skewtlines).enter().append("path")
            .style("fill", "none")
            .style("stroke", "red")
            .style("stroke-width", "2px")
            .attr("clip-path", "url(#clipper)")
            .attr("d", templine);

        var tempdewline = d3.line().curve(d3.curveBasis).x(function(d,i) { return x(d.dwpt) + (y(basep)-y(d.press))/tan; }).y(function(d,i) { return y(d.press); });
        var tempDewlines = skewtgroup.selectAll("tempdewlines")
            .data(skewtlines).enter().append("path")
            .style("fill", "none")
            .style("stroke", "green")
            .style("stroke-width", "2px")
            .attr("clip-path", "url(#clipper)")
            .attr("d", tempdewline);

        //barbs stuff
        var barbs = skewtline.filter(function(d) { return (d.wdir >= 0 && d.wspd >= 0 && d.press >= topp); });
        var allbarbs = barbgroup.selectAll("barbs")
            .data(barbs).enter().append("use")
            .attr("xlink:href", function (d) { return "#barb"+Math.round(convert(d.wspd, "kt")/5)*5; }) // 0,5,10,15,... always in kt
            .attr("transform", function(d,i) { return "translate("+w+","+y(d.press)+") rotate("+(d.wdir+180)+")"; });

        //mouse over
        drawToolTips(skewtlines[0]);
    };

    var clear = function(s){
        skewtgroup.selectAll("path").remove(); //clear previous paths from skew
        barbgroup.selectAll("use").remove(); //clear previous paths  from barbs
        //must clear tooltips!
        container.append("rect")
            .style("fill", "none")
            .style("pointer-events", "all")
            .attr("width", w)
            .attr("height", h)
            .on("mouseover", function(){ return false;})
            .on("mouseout", function() { return false;})
            .on("mousemove",function() { return false;});
    };

    //assings functions as public methods
    this.drawBackground = drawBackground;
    this.plot = plot;
    this.clear = clear;

    //init
    setVariables();
    resize();
};

export default SkewT;
