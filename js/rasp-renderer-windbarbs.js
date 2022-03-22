L.RaspRendererWindbarbs = L.Class.extend({
    initialize: function(map, layerGroup) {
        this._map = map;
        this.layerGroup = layerGroup;
    },
    clear: function() {
        this.layerGroup.clearLayers();
        this._map.off('zoomend', this._doRender, this);
        this._map.off('dragend', this._doRender, this);
        this._map.off('resize', this._doRender, this);
    },
    render: function(data, layerSpeed, layerAngle) {
        this.data = data;
        this.layerSpeed = layerSpeed;
        this.layerAngle = layerAngle;
        this.pixelWidth = (this.data.xmax - this.data.xmin) / this.data.width;
        this.pixelHeight = (this.data.ymax - this.data.ymin) / this.data.height;
        this._doRender();
        this._map.on('zoomend', this._doRender, this);
        this._map.on('dragend', this._doRender, this);
        this._map.on('resize', this._doRender, this);
    },
    _doRender: function() {
        this.layerGroup.clearLayers();
        this.barbs = [];
        var stride = Math.ceil(100 * 2**(5.5 + window.innerWidth / 2000 - this._map.getZoom()));
        var bounds = this._map.getBounds();
        for (let i = Math.floor(stride / 2); i < this.data.height - Math.floor(stride / 2); i += stride) {
            for (let j = Math.floor(stride / 2); j < this.data.width - Math.floor(stride / 2); j += stride) {
                var position = this._getPosition(i, j);
                if (!bounds.contains(position)) {
                    continue;
                }
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
                    this.barbs.push({position: position, icon: divIcon});
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
    _getPosition(i, j) {
        var x = this.data.xmin + (j + 0.5) * this.pixelWidth;
        var y = this.data.ymax - (i + 0.5) * this.pixelHeight;
        return L.CRS.EPSG3857.unproject(L.point(x, y));
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
