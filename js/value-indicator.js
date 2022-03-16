L.Control.ValueIndicator = L.Control.extend({
    options: {
        position: 'topleft',
        opacity: 1
    },
    initialize: function(sideScale, bottomScale, options) {
        this.sideScaleUnit = sideScale.getElementsByClassName("scaleUnit")[0];
        this.sideScaleMax = sideScale.getElementsByClassName("scaleMax")[0];
        this.sideScaleCanvasContainer = sideScale.getElementsByClassName("scaleColorbar")[0];
        this.sideScaleMin = sideScale.getElementsByClassName("scaleMin")[0];
        this.sideScaleIndicator = this.sideScaleCanvasContainer.getElementsByClassName("scaleIndicator")[0];
        this.sideScaleIndicatorValue = this.sideScaleIndicator.getElementsByClassName("scaleIndicatorValue")[0];

        this.bottomScaleUnit = bottomScale.getElementsByClassName("scaleUnit")[0];
        this.bottomScaleMax = bottomScale.getElementsByClassName("scaleMax")[0];
        this.bottomScaleCanvasContainer = bottomScale.getElementsByClassName("scaleColorbar")[0];
        this.bottomScaleMin = bottomScale.getElementsByClassName("scaleMin")[0];
        this.bottomScaleIndicator = this.bottomScaleCanvasContainer.getElementsByClassName("scaleIndicator")[0];
        this.bottomScaleIndicatorValue = this.bottomScaleIndicator.getElementsByClassName("scaleIndicatorValue")[0];
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
        this.sideScaleIndicator.style.visibility = 'visible';
        this.bottomScaleIndicator.style.visibility = 'visible';
        var posPercent = (value - this.sideScaleMin.innerHTML) / (this.sideScaleMax.innerHTML - this.sideScaleMin.innerHTML) * 100;
        posPercent = Math.max(0, Math.min(100, posPercent));
        this.sideScaleIndicator.style.bottom = `${posPercent}%`;
        this.bottomScaleIndicator.style.left = `${posPercent}%`;
        this.sideScaleIndicatorValue.innerHTML = value;
        this.bottomScaleIndicatorValue.innerHTML = value;
    },
    hideScaleIndicator: function() {
        this.sideScaleIndicator.style.visibility = 'hidden';
        this.bottomScaleIndicator.style.visibility = 'hidden';
    },
});

export default function (sideScale, bottomScale, options) {
    return new L.Control.ValueIndicator(sideScale, bottomScale, options);
};
