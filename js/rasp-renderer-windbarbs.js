L.RaspRendererWindbarbs = L.Class.extend({
    initialize: function(map, layerGroup) {
        this._map = map;
        this.layerGroup = layerGroup;
    },
    clear: function() {
        this.layerGroup.clearLayers();
        this._map.off('zoomend');
        this._map.off('dragend');
    },
    render: function(georasterSpeed, georasterAngle) {
        this.georasterSpeed = georasterSpeed;
        this.georasterAngle = georasterAngle;
        this._doRender();
        this._map.on('zoomend', this._doRender, this);
        this._map.on('dragend', this._doRender, this);
    },
    _doRender: function() {
        this.layerGroup.clearLayers();
        this.barbs = [];
        this.minDist = Math.pow(2, 6.5 - this._map.getZoom());
        var strideX = Math.ceil(this.minDist / this.georasterSpeed.pixelWidth);
        var strideY = Math.ceil(this.minDist/ this.georasterSpeed.pixelHeight);
        var bounds = this._map.getBounds();
        for (let i = Math.floor(strideY / 2); i < this.georasterSpeed.height - Math.floor(strideY / 2); i += strideY) {
            for (let j = Math.floor(strideX / 2); j < this.georasterSpeed.width - Math.floor(strideX / 2); j += strideX) {
                var position = this._getPosition(this.georasterSpeed, i, j);
                if (!bounds.contains(position)) {
                    continue;
                }
                var speed = this.georasterSpeed.values[0][i][j];
                var angle = this.georasterAngle.values[0][i][j];
                if (speed != this.georasterSpeed.noDataValue && angle != this.georasterAngle.noDataValue) {
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
    _getPosition(georaster, i, j) {
        var lat = georaster.ymax - (i + 0.5) * georaster.pixelHeight;
        var lng = georaster.xmin + (j + 0.5) * georaster.pixelHeight;
        return [lat, lng];
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
