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
        var ten   = 0;
        var five  = 0;
        var fifty = 0;
        var index = 0;
        var i;
        var path = "";
        if (speed > 0) {
            if (speed <= 7) {
                path += "M0 2 L8 2 ";
                index = 1;
            } else {
                path += "M1 2 L8 2 ";
            }
            five = Math.floor(speed / 5);
            if (speed % 5 >= 3) {
                five += 1;
            }
            fifty = Math.floor(five / 10);
            five -= fifty * 10;
            ten = Math.floor(five / 2);
            five -= ten * 2;
        }
        var j;
        for (i = 0; i < fifty; i++) {
            j = index + 2 * i;
            path += "M" + j + " 0 L" + (j + 1) + " 2 L" + j + " 2 L" + j + " 0 ";
        }
        if (fifty > 0) {
            index += 2 * (fifty - 0.5);
        }
        for (i = 0; i < ten; i++) {
            j = index + i;
            path += "M" + j + " 0 L" + (j + 1) + " 2 ";
        }
        index += ten;
        for (i = 0; i < five; i++) {
            j = index + i;
            path += "M" + (j + 0.5) + " 1 L" + (j + 1) + " 2 ";
        }
        path += "Z";
        return path;
    },
    _getBarb: function(speedKt, angle, size) {
        var flagPath = this._getFlagSvgPath(speedKt);
        var halfsize = Math.floor(size / 2);
        size = halfsize * 2;
        return `<svg width="${size}" height="${size}" viewBox="0 0 20 20"><path transform='translate(10 10) rotate(${angle + 90} 0 0) translate(-8 -2)' stroke='#000' stroke-width='0.5' d='${flagPath}'/></svg>`;
    }
});

export default function(map, options) {
    return new L.RaspRendererWindbarbs(map, options);
};
