import dict from '../lang.js';
import { cColorscales } from '../config.js';
import { unflatten } from './utils.js';

L.CrosssectionControl = L.Class.extend({
    initialize: function(raspControl, options) {
        this._raspControl = raspControl;
        this._map = this._raspControl._map;
        this.crosssectionButton = this._raspControl.crosssectionButton;
        this.crosssectionHelp = this._raspControl.interactiveHelp;
        this.crosssectionStatus = this._raspControl.interactiveStatus;
        this.crosssectionButton.onclick = () => { this.toggle(); };
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
        if (!this.isArmed || !(this.points.length == 2)) {
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
        fetch(`application?kind=crosssection&model=${model}&run_date=${runDate}&day=${day}&datetimeUTC=${datetimeUTC}&lat_start=${lat_start}&lon_start=${lon_start}&lat_end=${lat_end}&lon_end=${lon_end}`)
            .then(response => {
                if (response.ok) {
                    return response.arrayBuffer();
                } else {
                    throw Error("crosssectionError");
                }
            })
            .then(buffer => {
                // The incoming data is organized as follows:
                // [height, width, levels..., terrain..., w_cross..., cldfra_cross...]
                // where
                // levels has length height
                // terrain has length width
                // *_cross fields have length height*width
                var array = new Int32Array(buffer);
                var dims = array.subarray(0, 2);
                var height = dims[0];
                var width = dims[1];
                var levels = array.subarray(2, 2 + height);
                var terrain = array.subarray(2 + height, 2 + height + width);
                var w_cross = Array.from(array.subarray(2 + height + width, 2 + height + width + height * width), x => x / 100);
                var cldfra_cross = array.subarray(2 + height + width + height * width);
                var w_cross_unflatten = unflatten(w_cross, {height, width});
                var cldfra_cross_unflatten = unflatten(cldfra_cross, {height, width});
                var distance = new Int32Array([...Array(width).keys()]); // dummy distance for now

                var colorscale_w_cross = cColorscales["verticalmotion"].values.map((e, i) => { return [e, cColorscales["verticalmotion"].colors[i]]; });
                var colorscale_cldfra_cross = cColorscales["clouds"].values.map((e, i) => { return [e, cColorscales["clouds"].colors[i]]; });
                var plotlyData = [
                    {
                        // vertical motion
                        type: 'heatmap',
                        x: distance,
                        y: levels,
                        z: w_cross_unflatten,
                        customdata: cldfra_cross_unflatten,
                        zmin: -2.5,
                        zmax: 2.5,
                        zsmooth: 'best',
                        colorscale: colorscale_w_cross,
                        colorbar: {
                            outlinewidth: 0,
                            tickvals: [-2.5, 2.5],
                            title: {
                                text: "m/s"
                            }
                        },
                        hovertemplate: '%{y:.0f}m<br>' + dict("parameterCategory_wave_title") + ': %{z}m/s,<br>' + dict('cldfra') + ': %{customdata}%<extra></extra>'
                    },
                    {
                        // cloud fraction
                        type: 'heatmap',
                        x: distance,
                        y: levels,
                        z: cldfra_cross_unflatten,
                        zmin: 0,
                        zmax: 100,
                        zsmooth: 'fast',
                        opacity: 0.5,
                        colorscale: colorscale_cldfra_cross,
                        showscale: false,
                        hoverinfo: 'skip',
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
                        rangemode: 'nonnegative',
                        title: {
                            text: 'm'
                        }
                    },
                    margin: {
                        t: 0,
                        b: 0,
                        l: 0,
                        r: 0
                    },
                };

                import('plotly.js/dist/plotly-cartesian').then(({ default: Plotly }) => {
                    var plotlyLocaleImport = document.documentElement.lang == 'de' ? import('plotly.js-locales/de') : Promise.reject();
                    plotlyLocaleImport.then(({ default: locale }) => {
                        Plotly.register(locale);
                        Plotly.setPlotConfig({locale: 'de'});
                    }).catch(() => {
                        // ignore
                    }).finally(() => {
                        this._raspControl.currentPlot = {type: "crosssection"};
                        this._raspControl.updatePlot();
                        Plotly.newPlot('plotContent', plotlyData, plotlyLayout, {displayModeBar: false, responsive: true});
                    });
                });
            })
            .catch(err => {
                this.crosssectionStatus.innerHTML = dict(err.message);
                this._raspControl.closePlot();
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
