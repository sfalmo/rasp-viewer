import * as d3 from 'd3';
import drawWindbarbSvgPath from './draw-windbarb-svg-path.js';

// Gas constant for dry air at the surface of the Earth
const Rd = 287;
// Specific heat at constant pressure for dry air
const Cpd = 1005;
// Molecular weight ratio
const epsilon = 18.01528 / 28.9644;
// Heat of vaporization of water
const Lv = 2501000;
// Ratio of the specific gas constant of dry air to the specific gas constant for water vapour
const satPressure0c = 6.112;
// C + celsiusToK -> K
const celsiusToK = 273.15;
const L = -6.5e-3;
const g = 9.80665;

function tempDryAdiabat(p, t0, p0) {
    return (t0 + celsiusToK) * Math.pow(p / p0, Rd / Cpd) - celsiusToK;
}

function mixingRatio(partialPressure, totalPressure, molecularWeightRatio = epsilon) {
    return (molecularWeightRatio * partialPressure) / (totalPressure - partialPressure);
}

function saturationVaporPressure(tK) {
    const tC = tK - celsiusToK;
    return satPressure0c * Math.exp((17.67 * tC) / (tC + 243.5));
}

function saturationMixingRatio(p, tK) {
    return mixingRatio(saturationVaporPressure(tK), p);
}

function moistGradientT(p, t) {
    const tK = t + celsiusToK;
    const rs = saturationMixingRatio(p, tK);
    const n = Rd * tK + Lv * rs;
    const d = Cpd + (Math.pow(Lv, 2) * rs * epsilon) / (Rd * Math.pow(tK, 2));
    return (1 / p) * (n / d);
}

function vaporPressure(p, mixing) {
    return (p * mixing) / (epsilon + mixing);
}

function dewpoint(vaporp) {
    const val = Math.log(vaporp / satPressure0c);
    return (243.5 * val) / (17.67 - val);
}

var SkewT = function(div) {
    // properties used in calculations
    var wrapper = d3.select(div);
    var width = parseInt(wrapper.style('width'), 10);
    var height = width;
    var margin = {top: 25, right: 5, bottom: 25, left: 40}; // container margins
    var deg2rad = Math.PI/180;
    var basep = 1050;
    var topp = 290;
    var plines = [1000,850,700,500,300];
    var barbsize = 20;
    // functions for Scales and axes. Note the inverted domain for the y-scale: bigger is up!
    var bisectTemp = d3.bisector(function(d) { return d.press; }).left; // bisector function for tooltips
    var w, h, tan, x, y, cloudScale, cloudWaterScale, windScale, xAxis, yAxis, cloudAxis, cloudWaterAxis, windAxis;
    var data = [];

    var svg = wrapper.append("svg").attr("id", "svg"); // main svg
    var container = svg.append("g").attr("id", "container"); // container
    var skewtbg = container.append("g").attr("id", "skewtbg"); // background
    var skewtgroup = container.append("g"); // put skewt lines in this group
    var barbgroup = container.append("g")
        .style("stroke", "#000")
        .style("stroke-width", "1px")
        .style("fill", "none");

    function setVariables() {
        width = parseInt(wrapper.style('width'), 10);
        height = parseInt(wrapper.style('height'), 10);
        w = width - margin.left - margin.right;
        h = height - margin.top - margin.bottom;
        tan = h / w * 2;
        x = d3.scaleLinear().range([0, 14*w/15]).domain([-35,49]);
        y = d3.scaleLog().range([0, h]).domain([topp, basep]);
        cloudScale = d3.scaleLinear().range([0, w/6]).domain([0, 1]);
        cloudWaterScale = d3.scaleLinear().range([0, w/6]).domain([0, 1]);
        windScale = d3.scaleLinear().range([7 * w / 8, w]).domain([0, 50]);
        xAxis = d3.axisBottom(x).tickSize(0,0).ticks(10);
        yAxis = d3.axisLeft(y).tickSize(0,0).tickValues(plines).tickFormat(d3.format(".0d"));
        cloudAxis = d3.axisTop(cloudScale).tickSize(0,0).tickValues([0, 0.5, 1]);
        cloudWaterAxis = d3.axisBottom(cloudWaterScale).tickSize(0,0).tickValues([0.5, 1]);
        windAxis = d3.axisTop(windScale).tickSize(0,0).tickValues([0, 20, 40]);
    }

    function skewx(temp, press) {
        return x(temp) + (y(basep) - y(press)) / tan;
    }

    function skewline(tempkey) {
        return d3.line()
            .curve(d3.curveMonotoneY)
            .x(function(d, i) { return skewx(d[tempkey], d.press);})
            .y(function(d, i) { return y(d.press); } );
    }

    //assigns d3 events
    d3.select(window).on('resize', resize);

    function resize() {
        skewtbg.selectAll("*").remove();
        setVariables();
        svg.attr("width", w + margin.right + margin.left).attr("height", h + margin.top + margin.bottom);
        container.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        drawBackground();
        plot(data);
    }

    var drawBackground = function() {
        // Add clipping path
        var clipPolygonPoints = `0,0 0,${h} ${14*w/15},${h} ${14*w/15},${y(600)} ${3*w/4},${y(400)} ${3*w/4},0`;
        skewtbg.append("polygon")
            .attr("fill", "none")
            .attr("stroke", "currentColor")
            .attr("stroke-width", "0.5")
            .attr("points", clipPolygonPoints);

        skewtbg.append("clipPath")
            .attr("id", "clipper")
            .append("polygon")
            .attr("points", clipPolygonPoints);

        skewtbg.append("clipPath")
            .attr("id", "clipperWind")
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
            .style("stroke-width", function(d) { return d == 0 ? "1.5px" : "1px"; })
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
            .style("stroke-width", "1px")
            .attr("clip-path", "url(#clipper)");

        let dp = 10;

        var dryadiabats = [];
        for (let t0 of d3.range(-30, 100, 10)) {
            let dryad = [];
            for (let press of d3.range(basep, topp - 1, -dp)) {
                dryad.push({temp: tempDryAdiabat(press, t0, basep), press: press});
            }
            dryadiabats.push(dryad);
        }

        var moistadiabats = [];
        for (let t0 of d3.range(0, 35, 5)) {
            // The moist adiabats are approximated by numerical integration of the moist temperature gradient
            let moistad = [];
            let temp = t0;
            for (let press of d3.range(basep, topp - 1, -dp)) {
                moistad.push({temp: temp, press: press});
                temp -= dp * moistGradientT(press, temp);
            }
            moistadiabats.push(moistad);
        }

        var isohumes = [];
        for (let mixingRatio of [1, 2, 3, 5, 8, 12, 20]) { // mixing ratio in g/kg
            let isoh = [];
            for (let press of d3.range(basep, 401, -dp)) {
                isoh.push({temp: dewpoint(vaporPressure(press, mixingRatio / 1000)), press: press});
            }
            var textx = skewx(isoh[0].temp, isoh[0].press);
            var texty = y(isoh[0].press) - 5;
            skewtbg.append("text").attr("font-size", 10).attr("fill", "#380").attr("text-anchor", "middle").attr("x", textx).attr("y", texty).attr("transform", `rotate(-45 ${textx} ${texty})`).text(mixingRatio);
            isohumes.push(isoh);
        }
        skewtbg.append("text").attr("font-size", 10).attr("fill", "#380").attr("text-anchor", "start").attr("x", textx + 7).attr("y", texty).text("g/kg");

        // Draw dry adiabats
        skewtbg.selectAll("dryadiabatline")
            .data(dryadiabats)
            .enter().append("path")
            .style("stroke", "#fa0")
            .style("fill", "none")
            .style("stroke-width", "0.5px")
            .attr("clip-path", "url(#clipper)")
            .attr("d", skewline("temp"));

        // Draw moist adiabats
        skewtbg.selectAll("moistadiabatline")
            .data(moistadiabats)
            .enter().append("path")
            .style("stroke", "#380")
            .style("fill", "none")
            .style("stroke-width", "0.5px")
            .attr("clip-path", "url(#clipper)")
            .attr("d", skewline("temp"));

        // Draw isohumes
        skewtbg.selectAll("isohumeline")
            .data(isohumes)
            .enter().append("path")
            .style("stroke", "#380")
            .style("fill", "none")
            .style("stroke-width", "0.5px")
            .style("stroke-dasharray", "3")
            .attr("clip-path", "url(#clipper)")
            .attr("d", skewline("temp"));

        // Line along wind barbs
        skewtbg.append("line")
            .attr("x1", 7 * w / 8 - 0.5)
            .attr("x2", 7 * w / 8 - 0.5)
            .attr("y1", 0)
            .attr("y2", h)
            .style("stroke", "currentColor")
            .style("fill", "none")
            .style("stroke-width", "1");

        // Add axes
        skewtbg.append("g").attr("transform", "translate(0," + (h-0.5) + ")").call(xAxis);
        skewtbg.append("text").attr("font-size", 11).attr("text-anchor", "middle").attr("x", w/2).attr("y", h + 22).text("T (°C)");
        skewtbg.append("g").attr("transform", "translate(-0.5,0)").call(yAxis);
        skewtbg.append("text").attr("font-size", 11).attr("text-anchor", "middle").attr("transform", "rotate(270)").attr("y", -28).attr("x", -h/2).text("p (hPa)");
        skewtbg.append("g").call(cloudAxis);
        skewtbg.append("text").attr("font-size", 11).attr("text-anchor", "start").attr("x", 5).attr("y", -13).text("cloud fraction");
        skewtbg.append("g").call(cloudWaterAxis).selectAll("text").style("fill", "#380");
        skewtbg.append("text").attr("font-size", 11).attr("text-anchor", "start").attr("x", 5).attr("y", 20).style("fill", "#380").text("cloud water (g/kg)");
        skewtbg.append("g").call(windAxis);
        skewtbg.append("text").attr("font-size", 11).attr("text-anchor", "middle").attr("x", 15 * w / 16).attr("y", -13).text("v (m/s)");
    };

    var drawToolTips = function(skewtlines) {
        var lines = skewtlines.reverse();
        var tooltipgroup = skewtgroup.append("g").style("display", "none").attr("clip-path", "url(#clipperWind)");
        // Draw tooltips
        var tmpcfocus = tooltipgroup.append("g").style("fill", "red").style("stroke", "none");
        tmpcfocus.append("circle").attr("r", 4);
        tmpcfocus.append("text").attr("font-size", "small").attr("x", 6).attr("dy", ".35em");

        var dwpcfocus = tooltipgroup.append("g").style("fill", "blue").style("stroke", "none");
        dwpcfocus.append("circle").attr("r", 4);
        dwpcfocus.append("text").attr("font-size", "small").attr("x", -6).attr("text-anchor", "end").attr("dy", ".35em");

        var hghtfocus = tooltipgroup.append("g");
        hghtfocus.append("text").attr("font-size", "small").attr("x", 0).attr("text-anchor", "start").attr("dy", ".35em");

        var wspddot = tooltipgroup.append("circle").attr("r", 4).style("fill", "olive");
        var wdirfocus = tooltipgroup.append("g");
        wdirfocus.append("text").attr("font-size", "small").attr("x", 0).attr("text-anchor", "end").attr("dy", ".35em");
        var wspdfocus = tooltipgroup.append("g");
        wspdfocus.append("text").attr("font-size", "small").attr("x", 0).attr("text-anchor", "end").attr("dy", ".35em");

        container.append("rect")
            .style("fill", "none")
            .style("pointer-events", "all")
            .attr("width", w)
            .attr("height", h)
            .on("mouseover", function() { tooltipgroup.style("display", null); })
            .on("mouseout", function() { tooltipgroup.style("display", "none"); })
            .on("mousemove", function (event, datum) {
                var y0 = y.invert(d3.pointer(event)[1]); // get y value of mouse pointer in pressure space
                var i = bisectTemp(lines, y0, 1, lines.length-1);
                var d0 = lines[i - 1];
                var d1 = lines[i];
                var d = y0 - d0.press > d1.press - y0 ? d1 : d0;
                tmpcfocus.attr("transform", "translate(" + skewx(d.temp, d.press) + "," + y(d.press) + ")");
                dwpcfocus.attr("transform", "translate(" + skewx(d.dwpt, d.press) + "," + y(d.press) + ")");
                hghtfocus.attr("transform", "translate(3," + y(d.press) + ")");
                wdirfocus.attr("transform", "translate(" + w + "," + (y(d.press)+7) + ")");
                wspdfocus.attr("transform", "translate(" + w + "," + (y(d.press)-7) + ")");
                wspddot.attr("transform", "translate(" + windScale(d.wspd) + "," + y(d.press) + ")");
                tmpcfocus.select("text").text(Math.round(d.temp)+" °C");
                dwpcfocus.select("text").text(Math.round(d.dwpt)+" °C");
                hghtfocus.select("text").text(Math.round(d.hght)+" m");
                wdirfocus.select("text").text(Math.round(d.wdir) + "°");
                wspdfocus.select("text").text(Math.round(d.wspd) + " m/s");
            });
    };

    var plot = function(s){
        data = s;
        skewtgroup.selectAll("path").remove(); // clear previous paths from skew
        barbgroup.selectAll("path").remove(); // clear previous paths from skew

        if(data.length == 0) return;

        //skew-t stuff
        var skewtline = data.filter(function(d) { return (d.temp > -1000 && d.dwpt > -1000); });
        var skewtlines = [];
        skewtlines.push(skewtline);

        var tempLines = skewtgroup.selectAll("templines")
            .data(skewtlines).enter().append("path")
            .style("fill", "none")
            .style("stroke", "red")
            .style("stroke-width", "2px")
            .attr("clip-path", "url(#clipper)")
            .attr("d", skewline("temp"));

        var tempDewlines = skewtgroup.selectAll("tempdewlines")
            .data(skewtlines).enter().append("path")
            .style("fill", "none")
            .style("stroke", "blue")
            .style("stroke-width", "2px")
            .attr("clip-path", "url(#clipper)")
            .attr("d", skewline("dwpt"));

        //barbs stuff
        var barbs = skewtline.filter(function(d) { return (d.wdir >= 0 && d.wspd >= 0 && d.press >= topp); });
        var allbarbs = barbgroup.selectAll("barbs")
            .data(barbs).enter().append("path")
            .attr("d", function (d) { return drawWindbarbSvgPath(d.wspd * 1.94384); })
            .attr("transform", function(d,i) { return `translate(${7 * w / 8} ${y(d.press)}) rotate(${d.wdir}) translate(-20, -20)`; });

        var windSpeedPath = d3.line()
            .curve(d3.curveMonotoneY)
            .x(function(d, i) { return windScale(d.wspd);})
            .y(function(d, i) { return y(d.press); } );

        var windSpeedLine = skewtgroup.selectAll("windspeedlines")
            .data(skewtlines).enter().append("path")
            .style("fill", "none")
            .style("stroke", "olive")
            .style("stroke-width", "2px")
            .attr("clip-path", "url(#clipperWind)")
            .attr("d", windSpeedPath);

        var cloudArea = d3.area()
            .curve(d3.curveMonotoneY)
            .x0(0)
            .x1(function(d) { return cloudScale(d.cldfra); })
            .y(function(d) { return y(d.press); });

        var cloudAreaPlot = skewtgroup.selectAll("cloudarea")
            .data(skewtlines).enter().append("path")
            .style("fill", "grey")
            .style("opacity", "0.5")
            .attr("clip-path", "url(#clipper)")
            .attr("d", cloudArea);

        var cloudWaterPath = d3.line()
            .curve(d3.curveMonotoneY)
            .x(function(d, i) { return cloudWaterScale(d.qcloud * 1000);})
            .y(function(d, i) { return y(d.press); } );

        var cloudWaterLine = skewtgroup.selectAll("cloudwaterlines")
            .data(skewtlines).enter().append("path")
            .style("fill", "none")
            .style("stroke", "#380")
            .style("stroke-width", "1")
            .attr("clip-path", "url(#clipper)")
            .attr("d", cloudWaterPath);

        //mouse over
        drawToolTips(skewtlines[0]);
    };

    var clear = function(s){
        skewtgroup.selectAll("path").remove(); //clear previous paths from skew
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
