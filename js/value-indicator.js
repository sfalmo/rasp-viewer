import { isLandscape } from './utils';

L.Control.ValueIndicator = L.Control.extend({
    options: {
        position: 'topleft',
        opacity: 1
    },
    initialize: function(scale, options) {
        this.scaleUnit = scale.getElementsByClassName("scaleUnit")[0];
        this.scaleMax = scale.getElementsByClassName("scaleMax")[0];
        this.scaleCanvasContainer = scale.getElementsByClassName("scaleColorbar")[0];
        this.scaleMin = scale.getElementsByClassName("scaleMin")[0];
        this.scaleIndicator = this.scaleCanvasContainer.getElementsByClassName("scaleIndicator")[0];
    },
    onAdd: function (map) {
        this._container = L.DomUtil.create('div', 'leaflet-control-attribution bg-light user-select-none');
        this._parameter = L.DomUtil.create('span', 'fw-bold h5', this._container);
        this._value = L.DomUtil.create('span', 'ps-2 text-nowrap', this._container);
        return this._container;
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
    },
    updateScaleIndicator: function(value) {
        this.scaleIndicator.style.visibility = 'visible';
        var posPercent = (value - this.scaleMin.innerHTML) / (this.scaleMax.innerHTML - this.scaleMin.innerHTML) * 100;
        posPercent = Math.max(0, Math.min(100, posPercent));
        if (isLandscape()) {
            this.scaleIndicator.style.left = "0";
            this.scaleIndicator.style.bottom = `${posPercent}%`;
        } else {
            this.scaleIndicator.style.bottom = "0";
            this.scaleIndicator.style.left = `${posPercent}%`;
        }
        this.scaleIndicator.children[0].innerHTML = value;
    },
    hideScaleIndicator: function() {
        this.scaleIndicator.style.visibility = 'hidden';
    },
});

export default function (scale, options) {
    return new L.Control.ValueIndicator(scale, options);
};
