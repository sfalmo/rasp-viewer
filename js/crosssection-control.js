import * as plotty from 'plotty';
import Plotly from 'plotly.js/dist/plotly-cartesian';

function unflatten(valuesInOneDimension, size) {
    const {height, width} = size;
    const valuesInTwoDimensions = [];
    for (let y = 0; y < height; y++) {
        const start = y * width;
        const end = start + width;
        valuesInTwoDimensions.push(valuesInOneDimension.slice(start, end));
    }
    return valuesInTwoDimensions;
}

L.CrosssectionControl = L.Class.extend({
    initialize: function(raspControl, options) {
        this._raspControl = raspControl;
        this._map = raspControl._map;
        var raspPanel = raspControl._raspPanel;
        var crosssectionDiv = L.DomUtil.create('div', 'mb-2', raspPanel);
        this.crosssectionButton = L.DomUtil.create('button', 'btn btn-outline-primary mb-1', crosssectionDiv);
        this.crosssectionButton.title = "Cross Section";
        this.crosssectionButton.innerHTML = "Cross Section";
        this.crosssectionHelp = L.DomUtil.create('div', '', crosssectionDiv);
        this.crosssectionButton.onclick = () => { this.toggleSelector(); };

        this.points = [];
    },
    show: function() {
        this.crosssectionButton.style.display = "block";
    },
    hide: function() {
        this.crosssectionButton.style.display = "none";
    },
    toggleSelector: function() {
        if (this.isArmed) {
            this.isArmed = false;
            this.crosssectionButton.classList.remove("active");
            this.crosssectionHelp.innerHTML = "";
            this._map._container.style.cursor = "";
            this._map.off('click', this._addPoint, this);
            this._removePoints();
            this._raspControl.closePlot();
        } else {
            this.isArmed = true;
            this.crosssectionButton.classList.add("active");
            this.crosssectionHelp.innerHTML = "Click twice on the map to select the start and end point of the cross section. Press the above button again to deactivate the cross section tool.";
            this._map._container.style.cursor = "crosshair";
            this._map.on('click', this._addPoint, this);
        }
    },
    _removePoints: function() {
        this.points.forEach(marker => marker.remove());
        this.points = [];
        if (this.line) {
            this.line.remove();
        }
        this.line = null;
    },
    _addPoint: function(e) {
        if (this.points.length == 2) {
            this._removePoints();
        }
        var marker = L.marker(e.latlng, {draggable: true}).addTo(this._map)
            .on('moveend', () => { this.update(); });
        this.points.push(marker);
        if (this.points.length == 2) {
            this.update();
        }
    },
    update: function() {
        var {model, runDate, validDate, day, dir, time} = this._raspControl.datetimeSelector.get();
        var { lat: lat_start, lng: lon_start } = this.points[0].getLatLng();
        var { lat: lat_end, lng: lon_end } = this.points[1].getLatLng();
        if (this.line) {
            this.line.remove();
        }
        this.line = L.polyline([[lat_start, lon_start], [lat_end, lon_end]]).addTo(this._map);
        fetch(`crosssection?model=${model}&run_date=${runDate}&day=${day}&time=${time}&lat_start=${lat_start}&lon_start=${lon_start}&lat_end=${lat_end}&lon_end=${lon_end}`)
            .then(response => response.arrayBuffer())
            .then(buffer => {
                var array = new Int32Array(buffer);
                var dims = array.subarray(0, 2);
                var height = dims[0];
                var width = dims[1];
                var levels = array.subarray(2, height + 2);
                var crosssectionData = array.subarray(height + 2);
                var distance = new Int32Array([...Array(width).keys()]); // dummy distance for now

                var plotlyData = [
                    {
                        type: 'heatmap',
                        x: distance,
                        y: levels,
                        z: unflatten(crosssectionData, {height, width}),
                        zmin: -250,
                        zmax: 250,
                        zsmooth: 'best',
                        hovertemplate: '%{y:.0f}m, %{z}cm/s<extra></extra>'
                    }
                ];
                var plotlyLayout = {
                    xaxis: {
                        fixedrange: true,
                        automargin: true
                    },
                    yaxis: {
                        automargin: true
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
                Plotly.newPlot('test', plotlyData, plotlyLayout, {displayModeBar: false, responsive: true});
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
