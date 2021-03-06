L.Control.ValidIndicator = L.Control.extend({
    options: {
        position: 'topleft',
    },
    onAdd: function(map) {
        this._container = L.DomUtil.create('div', 'leaflet-control-attribution user-select-none');
        return this._container;
    },
    update: function(infoText, isValid) {
        this._container.style.color = isValid ? 'black' : 'red';
        this._container.innerHTML = infoText;
    }
});

export default function(options) {
    return new L.Control.ValidIndicator(options);
};
