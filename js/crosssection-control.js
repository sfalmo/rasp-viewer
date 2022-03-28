import { cColorscales } from '../config.js';
import { unflatten } from './utils.js';
import Plotly from 'plotly.js/dist/plotly-cartesian';

L.CrosssectionControl = L.Class.extend({
    initialize: function(raspControl, options) {
        this._raspControl = raspControl;
        this._map = raspControl._map;
        var raspPanel = raspControl._raspPanel;
        var crosssectionDiv = L.DomUtil.create('div', 'mb-2', raspPanel);
        this.crosssectionButton = L.DomUtil.create('button', 'btn btn-outline-primary mb-1', crosssectionDiv);
        this.crosssectionButton.title = dict("crosssection");
        this.crosssectionButton.innerHTML = dict("crosssection");
        this.crosssectionHelp = L.DomUtil.create('div', '', crosssectionDiv);
        this.crosssectionButton.onclick = () => { this.toggle(); };
        this.crosssectionStatus = L.DomUtil.create('div', 'text-danger', crosssectionDiv);
        this._raspControl.on('modelDayChange', () => { this.update(); });
        this._raspControl.on('timeChange', () => { this.update(); });

        this.points = [];
    },
    enable: function() {
        if (this.isArmed) {
            return;
        }
        this._raspControl.closePlot();
        this._raspControl.disableAllMapSelectors();
        this.isArmed = true;
        this.crosssectionButton.classList.add("active");
        this.crosssectionHelp.innerHTML = dict("crosssectionHelp");
        this._map._container.style.cursor = "crosshair";
        this._map.on('click', this._addPoint, this);
    },
    disable: function() {
        if (!this.isArmed) {
            return;
        }
        this.isArmed = false;
        this.crosssectionButton.classList.remove("active");
        this.crosssectionHelp.innerHTML = "";
        this.crosssectionStatus.innerHTML = "";
        this._map._container.style.cursor = "";
        this._map.off('click', this._addPoint, this);
        this.clear();
        this._raspControl.closePlot();
    },
    toggle: function() {
        if (this.isArmed) {
            this.disable();
        } else {
            this.enable();
        }
    },
    clear: function() {
        this.points.forEach(marker => marker.remove());
        this.points = [];
        if (this.line) {
            this.line.remove();
        }
        this.line = null;
    },
    _addPoint: function(e) {
        if (this.points.length == 2) {
            this.clear();
        }
        var marker = L.marker(e.latlng, {draggable: true}).addTo(this._map)
            .on('moveend', () => { this.update(); });
        this.points.push(marker);
        if (this.points.length == 2) {
            this.update();
        }
    },
    update: function() {
        if (!this.isArmed || !this.points.length == 2) {
            return;
        }
        var {model, runDate, validDate, day, dir, time, datetimeUTC} = this._raspControl.datetimeSelector.get();
        var { lat: lat_start, lng: lon_start } = this.points[0].getLatLng();
        var { lat: lat_end, lng: lon_end } = this.points[1].getLatLng();
        if (this.line) {
            this.line.remove();
        }
        this.line = L.polyline([[lat_start, lon_start], [lat_end, lon_end]]).addTo(this._map);
        this.crosssectionStatus.innerHTML = "";
        fetch(`crosssection?model=${model}&run_date=${runDate}&day=${day}&datetimeUTC=${datetimeUTC}&lat_start=${lat_start}&lon_start=${lon_start}&lat_end=${lat_end}&lon_end=${lon_end}`)
            .then(response => {
                if (response.ok) {
                    return response.arrayBuffer();
                } else {
                    throw Error("crosssectionError");
                }
            })
            .then(buffer => {
                // The incoming data is organized as follows:
                // [height, width, levels..., terrain..., crosssectionData...]
                // where
                // levels has length height
                // terrain has length width
                // crosssectionData has length height*width
                var array = new Int32Array(buffer);
                var dims = array.subarray(0, 2);
                var height = dims[0];
                var width = dims[1];
                var levels = array.subarray(2, height + 2);
                var terrain = array.subarray(height + 2, height + 2 + width);
                var crosssectionData = array.subarray(height + 2 + width);
                var distance = new Int32Array([...Array(width).keys()]); // dummy distance for now

                var colorscaleType = "verticalmotion";
                var colorscale = cColorscales[colorscaleType].values.map((e, i) => { return [e, cColorscales[colorscaleType].colors[i]]; });
                var plotlyData = [
                    {
                        // vertical motion
                        type: 'heatmap',
                        x: distance,
                        y: levels,
                        z: unflatten(crosssectionData, {height, width}),
                        zmin: -250,
                        zmax: 250,
                        zsmooth: 'best',
                        colorscale: colorscale,
                        colorbar: {
                            outlinewidth: 0,
                            tickvals: [-250, 0, 250],
                            title: "cm/s"
                        },
                        hovertemplate: '%{y:.0f}m, %{z}cm/s<extra></extra>'
                    },
                    {
                        // terrain
                        mode: 'lines',
                        x: distance,
                        y: terrain,
                        fill: 'tozeroy',
                        fillcolor: '#808080',
                        line: {
                            color: '#808080',
                        },
                        hoverinfo: 'skip',
                    }
                ];
                var plotlyLayout = {
                    xaxis: {
                        visible: false,
                        fixedrange: true,
                        range: [0, width - 1]
                    },
                    yaxis: {
                        automargin: true,
                        rangemode: 'nonnegative'
                    },
                    margin: {
                        t: 0,
                        b: 0,
                        l: 0,
                        r: 0
                    }
                };
                this._raspControl.currentPlot = {type: "crosssection"};
                this._raspControl.updatePlot();
                Plotly.newPlot('plotContent', plotlyData, plotlyLayout, {displayModeBar: false, responsive: true});
            })
            .catch(err => {
                this.crosssectionStatus.innerHTML = dict(err.message);
            })
            .finally(() => {
                this._raspControl.loadingPlot = false;
                this._raspControl._hideLoadingAnimationMaybe();
            });
        this._raspControl.loadingPlot = true;
        this._raspControl._armLoadingAnimation();
    },
});

export default function(raspControl, options) {
    return new L.CrosssectionControl(raspControl, options);
};
