L.Control.ValueIndicator = L.Control.extend({
    options: {
        position: 'topleft',
        opacity: 1
    },
    onAdd: function (map) {
        this._container = L.DomUtil.create('div', 'leaflet-control-attribution bg-light');
        this._parameter = L.DomUtil.create('span', 'fw-bold h5', this._container);
        this._value = L.DomUtil.create('span', 'ps-2 text-nowrap', this._container);
        L.DomEvent.disableClickPropagation(this._container);
        return this._container;
    },
    onRemove: function (map) {
        // Nothing to do
    },
    updateParameter: function (parameter) {
        this._parameter.style.color = parameter ? 'black' : 'red';
        this._parameter.innerHTML = parameter ? parameter : dict["dataMissing"];
    },
    updateValue: function (value) {
        if (value) {
            this._value.style.display = "inline";
            this._value.innerHTML = value;
        } else {
            this._value.style.display = "none";
        }
    }
});

export default function (options) {
    return new L.Control.ValueIndicator(options);
};
