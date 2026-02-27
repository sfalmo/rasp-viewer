L.RaspRendererWindbarbs = L.Class.extend({
    initialize: function(map, layerGroup) {
        this._map = map;
        this.layerGroup = layerGroup;
    },
    clear: function() {
        this.layerGroup.clearLayers();
        this._map.off('zoomend', this._doRender, this);
        this._map.off('moveend', this._doRender, this);
        this._map.off('resize', this._doRender, this);
    },
    render: function(data, layerSpeed, layerAngle) {
        this.data = data;
        this.layerSpeed = layerSpeed;
        this.layerAngle = layerAngle;
        this._doRender();
        this._map.on('zoomend', this._doRender, this);
        this._map.on('moveend', this._doRender, this);
        this._map.on('resize', this._doRender, this);
    },
    _doRender: function() {
        this.layerGroup.clearLayers();
        this.barbs = [];
        var mapSize = this._map.getSize();
        var stride = 120;
        var margin = Math.round(stride / 2);
        var xScaleFactor = this.data.width / (this.data.xmax - this.data.xmin);
        var yScaleFactor = this.data.height / (this.data.ymax - this.data.ymin);
        for (let xPixel = -margin; xPixel < mapSize.x + margin; xPixel += stride) {
            for (let yPixel = -margin; yPixel < mapSize.y + margin; yPixel += stride) {
                var latlng = this._map.containerPointToLatLng([xPixel, yPixel]);
                var {x, y} = L.CRS.EPSG3857.project(latlng);
                if (x < this.data.xmin || x > this.data.xmax || y < this.data.ymin || y > this.data.ymax) {
                    continue;
                }
                var j = Math.floor((x - this.data.xmin) * xScaleFactor);
                var i = Math.floor((this.data.ymax - y) * yScaleFactor);
                var speed = this.data[this.layerSpeed][0][i * this.data.width + j];
                var angle = this.data[this.layerAngle][0][i * this.data.width + j];
                if (speed != this.data.noDataValue && angle != this.data.noDataValue) {
                    var svg = this._getBarb(speed * 1.94384, angle, 80);
                    var divIcon = L.divIcon({
                        className: "leaflet-data-marker",
                        iconSize: [80, 80],
                        iconAnchor: [40, 40],
                        html: L.Util.template(svg)
                    });
                    this.barbs.push({position: latlng, icon: divIcon});
                }
            }
        }
        this.barbs.forEach(barb => {
            if (barb.position) {
                this.layerGroup.addLayer(L.marker(barb.position, {
                    pane: this.layerGroup.options.pane,
                    icon: barb.icon,
                    interactive: false,
                    keyboard: false
                }));
            }
        });
    },
    _getFlagSvgPath: function(speed) {
        var speedRounded = Math.round(speed / 5) * 5;
        var flags = Math.floor(speedRounded / 50);
        var pennants = Math.floor((speedRounded - flags * 50) / 10);
        var halfpennants = Math.floor((speedRounded - flags * 50 - pennants * 10) / 5);
        var path = "";
        if (speed > 0) {
            path += "M2 4 L16 4 ";
            var i;
            var j;
            var index = 0;
            for (i = 0; i < flags; i++) {
                j = 2 * index + 4 * i;
                path += "M" + j + " 0 L" + (j + 2) + " 4 L" + j + " 4 L" + j + " 0 ";
            }
            if (flags > 0) {
                index += 4 * flags - 2;
            }
            for (i = 0; i < pennants; i++) {
                j = 2 * index + 2 * i;
                path += "M" + j + " 0 L" + (j + 2) + " 4 ";
            }
            index += pennants;
            if (halfpennants == 1) { // cannot be more than one halfpennant
                j = 2 * index;
                if (flags == 0 && pennants == 0) {
                    j += 2;
                }
                path += "M" + (j + 1) + " 2 L" + (j + 2) + " 4 ";
            }
            path += "Z";
        }
        return path;
    },
    _getBarb: function(speedKt, angle, size) {
        var flagPath = this._getFlagSvgPath(speedKt);
        var halfsize = Math.floor(size / 2);
        size = halfsize * 2;
        return `<svg width="${size}" height="${size}" viewBox="0 0 40 40"><path transform='translate(20 20) rotate(${angle + 90} 0 0) translate(-16 -4)' stroke='#000' stroke-width='1' d='${flagPath}'/></svg>`;
    }
});

export default function(map, options) {
    return new L.RaspRendererWindbarbs(map, options);
};
