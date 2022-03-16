import * as plotty from 'plotty';

L.RaspRendererPlotty = L.Class.extend({
    options: {
        sideScaleContainerId: "sideScaleDiv",
        bottomScaleContainerId: "bottomScaleDiv",
    },
    initialize: function(map, canvas, options) {
        this._map = map;
        this.targetCanvas = canvas;
        this.workingCanvas = document.createElement("canvas");

        // Color scales
        var sideScaleContainer = document.getElementById(this.options.sideScaleContainerId);
        this.sideScaleUnit = L.DomUtil.create('div', 'scaleUnit', sideScaleContainer);
        this.sideScaleMax = L.DomUtil.create('div', 'scaleMax', sideScaleContainer);
        var sideScaleCanvasContainer = L.DomUtil.create('div', 'sideScaleCanvasDiv', sideScaleContainer);
        this.sideScaleCanvas = L.DomUtil.create('canvas', '', sideScaleCanvasContainer);
        this.sideScaleCanvas.height = 256;
        this.sideScaleCanvas.width = 1;
        this.sideScaleIndicator = L.DomUtil.create('div', 'sideScaleIndicator', sideScaleCanvasContainer);
        this.sideScaleIndicatorMarker = L.DomUtil.create('div', 'sideScaleIndicatorMarker', this.sideScaleIndicator);
        this.sideScaleIndicatorValue = L.DomUtil.create('div', 'sideScaleIndicatorValue', this.sideScaleIndicator);
        this.sideScaleMin = L.DomUtil.create('div', 'scaleMin', sideScaleContainer);

        var bottomScaleContainer = document.getElementById(this.options.bottomScaleContainerId);
        this.bottomScaleMin = L.DomUtil.create('div', 'scaleMin', bottomScaleContainer);
        var bottomScaleCanvasContainer = L.DomUtil.create('div', 'bottomScaleCanvasDiv', bottomScaleContainer);
        this.bottomScaleCanvas = L.DomUtil.create('canvas', '', bottomScaleCanvasContainer);
        this.bottomScaleCanvas.height = 1;
        this.bottomScaleCanvas.width = 256;
        this.bottomScaleIndicator = L.DomUtil.create('div', 'bottomScaleIndicator', bottomScaleCanvasContainer);
        this.bottomScaleIndicatorMarker = L.DomUtil.create('div', 'bottomScaleIndicatorMarker', this.bottomScaleIndicator);
        this.bottomScaleIndicatorValue = L.DomUtil.create('div', 'bottomScaleIndicatorValue', this.bottomScaleIndicator);
        this.bottomScaleMax = L.DomUtil.create('div', 'scaleMax', bottomScaleContainer);
        this.bottomScaleUnit = L.DomUtil.create('div', 'scaleUnit', bottomScaleContainer);

        plotty.addColorScale("rasp", ["#004dff", "#01f8e9", "#34c00c", "#f8fd00", "#ff9b00", "#ff1400"], [0, 0.2, 0.4, 0.6, 0.8, 1]);
        plotty.addColorScale("bsratio", ["#00000040", "#00000020", "#00000020", "#00000000"], [0.2999999, 0.3, 0.6999999, 0.7]);
        plotty.addColorScale("clouds", ["#ffffff", "#000000"], [0, 1]);
        plotty.addColorScale("clouds_low", ["#ff000000", "#ff0000ff"], [0, 1]);
        plotty.addColorScale("clouds_mid", ["#00ff0000", "#00ff00ff"], [0, 1]);
        plotty.addColorScale("clouds_high", ["#0000ff00", "#0000ffff"], [0, 1]);
        plotty.addColorScale("cloudpotential", ["#004dff", "#ffffbf", "#ff1400"], [0, 0.5, 1]);
        plotty.addColorScale("pfd", ["#ffffff", "#fec6fe", "#fc64fc", "#7f93e2", "#2e5de5", "#009900", "#57fc00", "#ffe900", "#f08200", "#ae1700"], [0, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 1]);
        this.plottyplot = new plotty.plot({
            canvas: this.workingCanvas,
            domain: [0, 1],
            clampLow: true,
            clampHigh: true,
            noDataValue: -999999,
            colorScale: 'rasp',
            useWebGL: true
        });
    },
    render: function(data, layer, options) {
        this._updateDataset(data, layer, options.dummy ? options.dummy : false);
        if (options.domain) {
            this.plottyplot.setDomain(options.domain);
        }
        this.plottyplot.setColorScale(options.colorscale ? options.colorscale : 'rasp'); // Default to rasp
        this.plottyplot.render();
        if (!options.append) {
            this.targetCanvas.width = this.workingCanvas.width;
            this.targetCanvas.height = this.workingCanvas.height;
            this._updateScale(options.domain, options.unit);
        }
        this.targetCanvas.getContext('2d').drawImage(this.workingCanvas, 0, 0);
    },
    _updateDataset: function(data, layer, dummy) {
        this.plottyplot.setNoDataValue(data.noDataValue);
        if (dummy) {
            var dummyData = new Float32Array(data.width * data.height);
            dummyData.fill(data.noDataValue);
            this.plottyplot.setData(dummyData, data.width, data.height);
        } else {
            this.plottyplot.setData(data[layer][0], data.width, data.height);
        }
    },
    _updateScale: function(domain, unit) {
        this._updateColorscale(domain, unit);
        this._updateScaleAnnotation(domain[0], domain[1], unit);
    },
    _updateColorscale: function(domain, unit) {
        let colorScaleCanvas = this.plottyplot.colorScaleCanvas;
        let colorScaleCtx = colorScaleCanvas.getContext('2d');
        let colorScaleData = colorScaleCtx.getImageData(0, 0, colorScaleCanvas.width, colorScaleCanvas.height);
        let bottomScaleCtx = this.bottomScaleCanvas.getContext('2d');
        bottomScaleCtx.putImageData(colorScaleData, 0, 0);
        // The color scale data has to be flipped for rendering it vertically in the side scale
        let sideScaleCtx = this.sideScaleCanvas.getContext('2d');
        let sideScaleData = sideScaleCtx.createImageData(colorScaleCanvas.height, colorScaleCanvas.width);
        for (let i = 0; i < colorScaleData.data.length; i+=4) {
            let r = colorScaleData.data.length - 4 - i;
            sideScaleData.data[i] = colorScaleData.data[r];
            sideScaleData.data[i+1] = colorScaleData.data[r+1];
            sideScaleData.data[i+2] = colorScaleData.data[r+2];
            sideScaleData.data[i+3] = colorScaleData.data[r+3];
        }
        sideScaleCtx.putImageData(sideScaleData, 0, 0);
    },
    _updateScaleAnnotation: function(min, max, scaleUnit) {
        this.sideScaleUnit.innerHTML = scaleUnit;
        this.sideScaleMax.innerHTML = max;
        this.sideScaleMin.innerHTML = min;
        this.bottomScaleUnit.innerHTML = scaleUnit;
        this.bottomScaleMax.innerHTML = max;
        this.bottomScaleMin.innerHTML = min;
    },
    updateScaleIndicator: function(value) {
        this.sideScaleIndicator.style.visibility = 'visible';
        this.bottomScaleIndicator.style.visibility = 'visible';
        var posPercent = (value - this.sideScaleMin.innerHTML) / (this.sideScaleMax.innerHTML - this.sideScaleMin.innerHTML) * 100;
        posPercent = Math.max(0, Math.min(100, posPercent));
        this.sideScaleIndicator.style.bottom = `${posPercent}%`;
        this.bottomScaleIndicator.style.left = `${posPercent}%`;
        this.sideScaleIndicatorValue.innerHTML = value;
        this.bottomScaleIndicatorValue.innerHTML = value;
    },
    hideScaleIndicator: function() {
        this.sideScaleIndicator.style.visibility = 'hidden';
        this.bottomScaleIndicator.style.visibility = 'hidden';
    },
    // quantize: function(value) {
    //     this.plottyplot.setExpression(`floor(dataset / ${value} + 0.5) * ${value}`);
    // },
    // unquantize: function() {
    //     this.plottyplot.setExpression("");
    // }
});

export default function(map, canvas, options) {
    return new L.RaspRendererPlotty(map, canvas, options);
};
