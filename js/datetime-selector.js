import dict from '../lang.js';
import { cModels , cCategories , cParameters , cMeteograms , cLayers , cDefaults } from '../config.js';
import { DateTime } from 'luxon';

L.Control.DatetimeSelector = L.Control.extend({
    options: {
        position: 'topleft',
    },
    initialize: function(raspControl, options) {
        this._raspControl = raspControl;
    },
    onAdd: function (map) {
        this._container = L.DomUtil.create('div', 'leaflet-control-layers datetime-control');
        this._container.style.backgroundColor = "rgba(255, 255, 255, 0)";
        this._container.style.borderStyle = "none";
        L.DomEvent.disableClickPropagation(this._container);
        L.DomEvent.disableScrollPropagation(this._container);
        var modelDayTimeDiv = L.DomUtil.create('div', 'd-flex justify-content-center', this._container);
        var modelDayGroup = L.DomUtil.create('div', '', modelDayTimeDiv);
        this.modelDaySelect = L.DomUtil.create('select', 'form-select w-auto', modelDayGroup);
        this.modelDaySelect.title = dict("modelDaySelect_title");
        this.modelDaySelect.onchange = () => {
            this.doHours();
            var data = this.get();
            var event = new CustomEvent('modelDayChange', { detail: data });
            this._raspControl.dispatchEvent(event);
        };
        var timeGroup = L.DomUtil.create('div', 'input-group ms-1 w-auto rounded', modelDayTimeDiv);
        timeGroup.style.backgroundColor = "rgba(255, 255, 255, 1)";
        this.timePrevButton = L.DomUtil.create('button', 'btn btn-outline-secondary', timeGroup);
        this.timePrevButton.innerHTML = '◄';
        this.timePrevButton.onclick = () => {
            this.timeChangeCyclic(-1);
            var data = this.get();
            var event = new CustomEvent('timeChange', { detail: data });
            this._raspControl.dispatchEvent(event);
        };
        this.timeSelect = L.DomUtil.create('select', 'form-select', timeGroup);
        this.timeSelect.onchange = () => {
            var data = this.get();
            var event = new CustomEvent('timeChange', { detail: data });
            this._raspControl.dispatchEvent(event);
        };
        this.timeSelect.title = dict("timeSelect_title");
        this.timeNextButton = L.DomUtil.create('button', 'btn btn-outline-secondary', timeGroup);
        this.timeNextButton.innerHTML = '►';
        this.timeNextButton.onclick = () => {
            this.timeChangeCyclic(1);
            var data = this.get();
            var event = new CustomEvent('timeChange', { detail: data });
            this._raspControl.dispatchEvent(event);
        };

        return this._container;
    },
    get: function() {
        var {modelKey, runDate, validDate, day} = JSON.parse(this.modelDaySelect.value);
        var dir = modelKey + "/" + runDate + "/" + day;
        var time = this.timeSelect.value;
        var datetimeUTC = DateTime.fromISO(`${validDate}T${time.slice(0,2)}:${time.slice(2,4)}`, { zone: cModels[modelKey].timezone }).toUTC().toISO();
        return {model: modelKey, runDate: runDate, validDate: validDate, day: day, dir: dir, time: time, datetimeUTC: datetimeUTC};
    },
    findLatestRun: function(modelDay) {
        var {modelKey, day} = modelDay;
        var model = cModels[modelKey];
        var today = DateTime.now().setZone(model.timezone);
        var validDate = today.plus({ days: day });
        function fetchRecursive(runDate, day) {
            if (day > Math.max(...model.days, model.days.length)) {
                return undefined;
            }
	    if (day < 0) {
                day += 1;
                return fetchRecursive(runDate.minus({ days: 1 }), day);
	    }
            var logDir = cDefaults.forecastServerResults + "/LOG/" + modelKey + "/" + runDate.toISODate() + "/" + day;
            return fetch(logDir + "/wrf.out", {
                method: "HEAD",
            }).then(response => {
                    if (response.ok) {
                        return {modelKey: modelKey, validDate: validDate, runDate: runDate, day: day};
                    } else {
                        day += 1;
                        return fetchRecursive(runDate.minus({ days: 1 }), day);
                    }
                });
        };
        return fetchRecursive(today, day);
    },
    init: function() {
        const dayNames = [dict("Sunday"), dict("Monday"), dict("Tuesday"), dict("Wednesday"), dict("Thursday"), dict("Friday"), dict("Saturday")];
        const monthNames = ["Jan", "Feb", dict("Mar"), "Apr", dict("May"), "Jun", "Jul", "Aug", "Sep", dict("Oct"), "Nov", dict("Dec")];
        var modelDayList = [];
        for (const modelKey of Object.keys(cModels)) {
            var model = cModels[modelKey];
            for (const day of model.days) { // Add all days
                modelDayList.push({modelKey: modelKey, day: day});
            }
        }
        this.modelDaySelect.options.length = 0; // Empty list
        return Promise.all(modelDayList.map(this.findLatestRun))
            .then(results => {
                for (var r of results) {
                    if (!r) {
                        continue;
                    }
                    var {modelKey, runDate, validDate, day} = r;
                    var description = validDate.toLocaleString(DateTime.DATE_SHORT);
                    var selectValue = {modelKey: modelKey, runDate: runDate.toISODate(), validDate: validDate.toISODate(), day: day};
                    this.modelDaySelect.add(new Option(description, JSON.stringify(selectValue)));
                    var today = DateTime.now().setZone(cModels[modelKey].timezone);
                    if (validDate.toISODate() == today.toISODate()) {
                        this.modelDaySelect[this.modelDaySelect.length - 1].selected = "selected";
                    }
                }
            })
            .then(() => { this.doHours(); });
    },
    doHours: function() {
        var currentHour = this.timeSelect.value;
        this.timeSelect.options.length = 0; // Clear all times
        var model = cModels[this.get().model];
        for (const hour of model.hours) {
            this.timeSelect.add(new Option(hour.slice(0, 2) + ':' + hour.slice(2, 4), hour));
            if (!currentHour && hour == cDefaults.startHour || hour == currentHour) {
                this.timeSelect.options[this.timeSelect.options.length - 1].selected = true;
            }
        }
    },
    timeChangeCyclic: function(direction) {
        // direction = +1 -> forward, direction = -1 -> backward
        var index = this.timeSelect.selectedIndex;
        index += direction;
        if (index > this.timeSelect.length - 1) {
            index = 0;
        }
        if (index < 0) {
            index = this.timeSelect.length - 1;
        }
        this.timeSelect.selectedIndex = index;
    },
});

export default function (raspControl, options) {
    return new L.Control.DatetimeSelector(raspControl, options);
};
