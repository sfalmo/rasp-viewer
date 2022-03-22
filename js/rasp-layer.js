import { cModels , cCategories , cParameters , cSoundings , cMeteograms , cLayers , cDefaults } from '../config.js';
import valueIndicator from './value-indicator.js';
import raspRendererPlotty from './rasp-renderer-plotty.js';
import raspRendererWindbarbs from './rasp-renderer-windbarbs.js';

L.RaspLayer = L.Layer.extend({
    initialize: function(options) {
        L.setOptions(this, options);
    },
    onAdd: function(map) {
        this._map = map;

        this.opacityLevel = cDefaults.opacityLevel;
        this.opacityDelta = cDefaults.opacityDelta;
        this.setOpacity(this.opacityLevel);

        this.canvas = document.createElement('canvas');
        this.overlay = L.imageOverlay(this.canvas.toDataURL(), [[0,1], [0,1]]).addTo(this._map);
        this.scale = document.getElementById("scale");
        this.windbarbs = L.layerGroup([], {pane: 'shadowPane'}).addTo(this._map);

        // Renderers
        this.plottyRenderer = raspRendererPlotty(this._map, this.canvas, this.scale);
        this.windbarbRenderer = raspRendererWindbarbs(this._map, this.windbarbs);

        // Value indicator
        this.valueIndicator = valueIndicator(this.scale);
        this.valueIndicator.addTo(this._map);
        this._map.on('mousemove', this._onMouseMove, this);
        return this;
    },
    onRemove: function() {
        this._map.off('mousemove', this._onMouseMove, this);
    },
    opacityUp: function() {
        this.opacityLevel = Math.min(this.opacityLevel + this.opacityDelta, 1);
        this.setOpacity(this.opacityLevel);
    },
    opacityDown: function() {
        this.opacityLevel = Math.max(this.opacityLevel - this.opacityDelta, 0);
        this.setOpacity(this.opacityLevel);
    },
    setOpacity: function(opacity) {
        this._map.getPane('overlayPane').style.opacity = opacity;
        this._map.getPane('shadowPane').style.opacity = opacity;
    },
    invalidate: function() {
        this.valid = false;
        this.setOpacity(0);
        this.plottyRenderer.hideScaleIndicator();
        this.valueIndicator.updateParameter(undefined);
    },
    update: function(georasters, parameter) {
        this.valid = true;
        if (parameter.composite) {
            this.units = parameter.composite.units;
            this.domains = parameter.composite.domains;
        } else {
            this.units = [parameter.unit];
            this.domains = [parameter.domain];
        }
        this.valueIndicator.updateParameter(parameter.longname);
        Promise.all(georasters.map(georaster => georaster.readRasters()))
            .then(data => {
                this.data = data;
                this.data.width = this.data[0].width;
                this.data.height = this.data[0].height;
                var [xmin, ymin, xmax, ymax] = georasters[0].getBoundingBox();
                this.data.xmin = xmin;
                this.data.ymin = ymin;
                this.data.xmax = xmax;
                this.data.ymax = ymax;
                this.data.noDataValue = georasters[0].getGDALNoData();
                this._render(parameter);
                this._updateValueIndicator(this._lastLat, this._lastLng);
            });
    },
    _render: function(parameter) {
        this.windbarbRenderer.clear();
        this.overlay.setBounds([L.CRS.EPSG3857.unproject(L.point(this.data.xmin, this.data.ymin)), L.CRS.EPSG3857.unproject(L.point(this.data.xmax, this.data.ymax))]);
        // The base parameter is always displayed as a heatmap (currently realized via the plotty renderer)
        if (!parameter.composite) {
            this.plottyRenderer.render(this.data, 0, {domain: this.domains[0], unit: this.units[0], colorscale: parameter.colorscale});
        } else {
            // For composite parameters, the additional fields must also be rendered according to the composite type
            if (parameter.composite.type == "wstar_bsratio") {
                this.plottyRenderer.render(this.data, 0, {domain: this.domains[0], unit: this.units[0]});
                this.plottyRenderer.render(this.data, 1, {domain: this.domains[1], unit: this.units[1], colorscale: 'bsratio', append: true});
            }
            if (parameter.composite.type == "wind") {
                this.plottyRenderer.render(this.data, 0, {domain: this.domains[0], unit: this.units[0]});
                this.windbarbRenderer.render(this.data, 0, 1);
            }
            if (parameter.composite.type == "clouds") {
                this.plottyRenderer.render(this.data, 0, {domain: this.domains[0], unit: this.units[0], colorscale: 'clouds', dummy: true});
                this.plottyRenderer.render(this.data, 0, {domain: this.domains[0], unit: this.units[0], colorscale: 'clouds_low', append: true});
                this.plottyRenderer.render(this.data, 1, {domain: this.domains[1], unit: this.units[1], colorscale: 'clouds_mid', append: true});
                this.plottyRenderer.render(this.data, 2, {domain: this.domains[2], unit: this.units[2], colorscale: 'clouds_high', append: true});
            }
            if (parameter.composite.type == "press") {
                this.plottyRenderer.render(this.data, 0, {domain: this.domains[0], unit: this.units[0], colorscale: 'verticalmotion'});
                this.windbarbRenderer.render(this.data, 1, 2);
            }
        }
        this.overlay.setUrl(this.canvas.toDataURL());
        this.setOpacity(this.opacityLevel);
    },
    _updateValueIndicator(lat, lng) {
        if (!lat || !lng) return;
        this._lastLat = lat;
        this._lastLng = lng;
        var {x, y} = L.CRS.EPSG3857.project({lat, lng});
        // The (0, 0) index of the georaster data is at the top left corner
        var ix = Math.floor((x - this.data.xmin) / (this.data.xmax - this.data.xmin) * this.data.width);
        var iy = Math.floor((this.data.ymax - y) / (this.data.ymax - this.data.ymin) * this.data.height);
        var values = [];
        if (ix >= 0 && ix < this.data.width && iy >= 0 && iy < this.data.height) { // we are inside the domain
            this.data.forEach((data, i) => {
                values[i] = data[0][iy * this.data.width + ix].toFixed(0);
            });
        }
        var valueText = "";
        if (values.length != 0 && values[0] != this.data.noDataValue) {
            values.forEach((value, i) => {
                if (i != 0) {
                    valueText += ", ";
                } else {
                    this.valueIndicator.updateScaleIndicator(value);
                }
                valueText += `${value} ${this.units[i]}`;
            });
        } else {
            this.valueIndicator.hideScaleIndicator();
        }
        this.valueIndicator.updateValue(valueText);
    },
    _onMouseMove: function(e) {
        if (this.valid && this.data) {
            this._updateValueIndicator(e.latlng.lat, e.latlng.lng);
        }
    }
});

export default function(options) {
    return new L.RaspLayer(options);
};
