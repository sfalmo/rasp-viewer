import drawWindbarbSvgPath from './draw-windbarb-svg-path.js';

L.RaspRendererWindbarbs = L.Class.extend({
    initialize: function(map, layerGroup) {
        this._map = map;
        this.layerGroup = layerGroup;
        this.windbarbSvgPaths = [];
        for (let speed = 0; speed < 200; speed += 5) {
            this.windbarbSvgPaths.push(drawWindbarbSvgPath(speed));
        }
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
        var iconSize = 60;
        var mapSize = this._map.getSize();
        var stride = 100;
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
                    var svg = this._getBarb(speed * 1.94384, angle, iconSize);
                    var divIcon = L.divIcon({
                        className: "leaflet-data-marker",
                        iconSize: [iconSize, iconSize],
                        iconAnchor: [iconSize / 2, iconSize / 2],
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
    _getBarb: function(speedKt, angle, size) {
        var flagPath = speedKt > 0 ? this.windbarbSvgPaths[Math.round(speedKt / 5)] : "";
        var svg = `<svg width="${size}" height="${size}" viewBox="0 0 40 40" transform='rotate(${angle})'><path stroke="#000" stroke-width="1" d='${flagPath}'/></svg>`;
        return svg;
    }
});

export default function(map, options) {
    return new L.RaspRendererWindbarbs(map, options);
};
