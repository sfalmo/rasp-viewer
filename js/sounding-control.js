import SkewT from './skewt';

L.SoundingControl = L.Class.extend({
    initialize: function(raspControl, options) {
        this._raspControl = raspControl;
        this._map = raspControl._map;
        var raspPanel = raspControl._raspPanel;
        var soundingDiv = L.DomUtil.create('div', 'mb-2', raspPanel);
        this.soundingButton = L.DomUtil.create('button', 'btn btn-outline-primary mb-1', soundingDiv);
        this.soundingButton.title = dict("sounding");
        this.soundingButton.innerHTML = dict("sounding");
        this.soundingHelp = L.DomUtil.create('div', '', soundingDiv);
        this.soundingButton.onclick = () => { this.toggle(); };
        this.soundingStatus = L.DomUtil.create('div', 'text-danger', soundingDiv);
        this._raspControl.on('modelDayChange', () => { this.update(); });
        this._raspControl.on('timeChange', () => { this.update(); });

        this.point = null;
    },
    enable: function() {
        if (this.isArmed) {
            return;
        }
        this._raspControl.closePlot();
        this._raspControl.disableAllMapSelectors();
        this.isArmed = true;
        this.soundingButton.classList.add("active");
        this.soundingHelp.innerHTML = dict("soundingHelp");
        this._map._container.style.cursor = "crosshair";
        this._map.on('click', this._selectPoint, this);
    },
    disable: function() {
        if (!this.isArmed) {
            return;
        }
        this.isArmed = false;
        this.soundingButton.classList.remove("active");
        this.soundingHelp.innerHTML = "";
        this.soundingStatus.innerHTML = "";
        this._map._container.style.cursor = "";
        this._map.off('click', this._selectPoint, this);
        this.clear();
        this._raspControl.closePlot();
    },
    toggle: function() {
        if (this.isArmed) {
            this.disable();
        } else {
            this.enable();
        }
    },
    clear: function() {
        if (this.point) {
            this.point.remove();
        }
        this.point = null;
    },
    _selectPoint: function(e) {
        this.clear();
        var marker = L.marker(e.latlng, {draggable: true}).addTo(this._map)
            .on('moveend', () => { this.update(); });
        this.point = marker;
        this.update();
    },
    update: function() {
        if (!this.isArmed || !this.point) {
            return;
        }
        var {model, runDate, validDate, day, dir, time, datetimeUTC} = this._raspControl.datetimeSelector.get();
        var {lat, lng} = this.point.getLatLng();
        this.soundingStatus.innerHTML = "";
        fetch(`sounding?model=${model}&run_date=${runDate}&day=${day}&datetimeUTC=${datetimeUTC}&lat=${lat}&lon=${lng}`)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw Error("soundingError");
                }
            })
            .then(soundingJson => {
                this._raspControl.currentPlot = {type: "crosssection"};
                this._raspControl.updatePlot();
                var skewt = new SkewT('#plotContent');
                skewt.plot(soundingJson);
            })
            .catch(err => {
                this.soundingStatus.innerHTML = dict(err.message);
                this._raspControl.closePlot();
            })
            .finally(() => {
                this._raspControl.loadingPlot = false;
                this._raspControl._hideLoadingAnimationMaybe();
            });
        this._raspControl.loadingPlot = true;
        this._raspControl._armLoadingAnimation();
    },
});

export default function(raspControl, options) {
    return new L.SoundingControl(raspControl, options);
};

