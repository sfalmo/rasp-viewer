import dict from '../lang.js';
import { isLandscape } from './utils';

L.Control.ValueIndicator = L.Control.extend({
    options: {
        position: 'topleft'
    },
    initialize: function(scale, options) {
        this.numberFormat = new Intl.NumberFormat(document.documentElement.lang);
        this.scaleCanvasContainer = scale.getElementsByClassName("scaleColorbar")[0];
        this.scaleIndicator = this.scaleCanvasContainer.getElementsByClassName("scaleIndicator")[0];
        this.hideScaleIndicator();
    },
    onAdd: function (map) {
        this._container = L.DomUtil.create('div', 'leaflet-control-attribution user-select-none');
        this._parameter = L.DomUtil.create('span', 'fw-bold h5', this._container);
        this._value = L.DomUtil.create('span', 'ps-2 text-nowrap', this._container);
        return this._container;
    },
    updateParameter: function (parameter) {
        this._parameter.style.color = parameter ? 'black' : 'red';
        this._parameter.innerHTML = parameter ? parameter : dict("dataMissing");
    },
    updateValueText: function (valueText) {
        if (valueText) {
            this._value.style.display = "inline";
            this._value.innerHTML = valueText;
        } else {
            this._value.style.display = "none";
        }
    },
    updateScaleIndicator: function(value, domain, mult) {
        this.scaleIndicator.style.visibility = 'visible';
        var posPercent = (value * mult - domain[0]) / (domain[1] - domain[0]) * 100;
        posPercent = Math.max(0, Math.min(100, posPercent));
        if (isLandscape()) {
            this.scaleIndicator.style.left = "0";
            this.scaleIndicator.style.bottom = `${posPercent}%`;
        } else {
            this.scaleIndicator.style.bottom = "0";
            this.scaleIndicator.style.left = `${posPercent}%`;
        }
        this.scaleIndicator.children[0].innerHTML = this.numberFormat.format(value);
    },
    hideScaleIndicator: function() {
        this.scaleIndicator.style.visibility = 'hidden';
    },
});

export default function (scale, options) {
    return new L.Control.ValueIndicator(scale, options);
};
