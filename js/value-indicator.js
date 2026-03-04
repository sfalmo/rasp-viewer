import dict from '../lang.js';
import { isLandscape } from './utils';

L.Control.ValueIndicator = L.Control.extend({
    options: {
        position: 'topleft'
    },
    initialize: function(scale, options) {
        this.numberFormat = new Intl.NumberFormat(document.documentElement.lang);
        this.scaleCanvasContainer = scale.getElementsByClassName("scaleColorbar")[0];
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
    initScaleIndicators: function(n, colors=["#000"]) {
        for (const i in this.scaleIndicators) {
            L.DomUtil.remove(this.scaleIndicators[i]);
        }
        this.scaleIndicators = [];
        this.scaleIndicatorValues = [];
        for (let i = 0; i < n; i += 1) {
            var scaleIndicator = L.DomUtil.create('div', 'scaleIndicator', this.scaleCanvasContainer);
            var scaleIndicatorValue = L.DomUtil.create('div', 'scaleIndicatorValue', scaleIndicator);
            scaleIndicator.style.color = colors[i];
            this.scaleIndicators.push(scaleIndicator);
            this.scaleIndicatorValues.push(scaleIndicatorValue);
        }
    },
    updateScaleIndicators: function(values, domains, mults) {
        for (const i in this.scaleIndicators) {
            const value = values[i];
            const domain = domains[i];
            const mult = mults === undefined || mults[i] === undefined ? 1 : mults[i];
            this.scaleIndicators[i].style.visibility = 'visible';
            var posPercent = (value - domain[0]) / (domain[1] - domain[0]) * 100;
            posPercent = Math.max(0, Math.min(100, posPercent));
            if (isLandscape()) {
                this.scaleIndicators[i].style.left = "0";
                this.scaleIndicators[i].style.bottom = `${posPercent}%`;
            } else {
                this.scaleIndicators[i].style.bottom = "0";
                this.scaleIndicators[i].style.left = `${posPercent}%`;
            }
            this.scaleIndicatorValues[i].innerHTML = this.numberFormat.format(value / mult);
        }
    },
    hideScaleIndicators: function() {
        for (const i in this.scaleIndicators) {
            this.scaleIndicators[i].style.visibility = 'hidden';
        }
    },
});

export default function (scale, options) {
    return new L.Control.ValueIndicator(scale, options);
};
