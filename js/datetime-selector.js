import { cModels , cCategories , cParameters , cSoundings , cMeteograms , cLayers , cDefaults } from '../config.js';

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
        var modelDayTimeDiv = L.DomUtil.create('div', 'd-flex justify-content-center', this._container);
        var modelDayGroup = L.DomUtil.create('div', '', modelDayTimeDiv);
        this.modelDaySelect = L.DomUtil.create('select', 'form-select w-auto', modelDayGroup);
        this.modelDaySelect.title = dict["modelDaySelect_title"];
        this.modelDaySelect.onchange = () => {
            this.doHours();
            this._raspControl.modelDayChange();
        };
        var timeGroup = L.DomUtil.create('div', 'input-group ms-1 w-auto rounded', modelDayTimeDiv);
        timeGroup.style.backgroundColor = "rgba(255, 255, 255, 1)";
        this.timePrevButton = L.DomUtil.create('button', 'btn btn-outline-secondary', timeGroup);
        this.timePrevButton.innerHTML = '◄';
        this.timePrevButton.onclick = () => {
            this.timeChangeCyclic(-1);
            this._raspControl.update();
        };
        this.timeSelect = L.DomUtil.create('select', 'form-select', timeGroup);
        this.timeSelect.onchange = () => { this._raspControl.update(); };
        this.timeSelect.title = dict["timeSelect_title"];
        this.timeNextButton = L.DomUtil.create('button', 'btn btn-outline-secondary', timeGroup);
        this.timeNextButton.innerHTML = '►';
        this.timeNextButton.onclick = () => {
            this.timeChangeCyclic(1);
            this._raspControl.update();
        };

        return this._container;
    },
    onRemove: function (map) {
        // Nothing to do
    },
    get: function() {
        var [model, runDate, day] = this.modelDaySelect.value.split("/");
        return {model: model, runDate: runDate, day: day, time: this.timeSelect.value, dir: this.modelDaySelect.value};
    },
    findLatestRun: function(modelDay) {
        var {modelKey, day} = modelDay;
        var model = cModels[modelKey];
        var today = new Date();
        var validDate = new Date();
        validDate.setDate(today.getDate() + day);
        function fetchRecursive(runDate, day) {
            if (day > Math.max(...model.days, model.days.length)) {
                return undefined;
            }
            var logDir = cDefaults.forecastServerResults + "/LOG/" + modelKey + "/" + runDate.toLocaleDateString('en-CA') + "/" + day;
            return fetch(logDir + "/wrf.out")
                .then(response => {
                    if (response.ok) {
                        return {modelKey: modelKey, validDate: validDate, runDate: runDate, day: day};
                    } else {
                        runDate.setDate(runDate.getDate() - 1);
                        day += 1;
                        return fetchRecursive(runDate, day);
                    }
                });
        };
        return fetchRecursive(today, day);
    },
    init: function() {
        const dayNames = [dict["Sunday"], dict["Monday"], dict["Tuesday"], dict["Wednesday"], dict["Thursday"], dict["Friday"], dict["Saturday"]];
        const monthNames = ["Jan", "Feb", dict["Mar"], "Apr", dict["May"], "Jun", "Jul", "Aug", "Sep", dict["Oct"], "Nov", dict["Dec"]];
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
                    var {modelKey, validDate, runDate, day} = r;
                    var description = validDate.toLocaleDateString();
                    var dir = modelKey + "/" + runDate.toLocaleDateString('en-CA') + "/" + day;
                    this.modelDaySelect.add(new Option(description, dir));
                    var today = new Date();
                    if (validDate.toDateString() == today.toDateString()) {
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
            this.timeSelect.add(new Option(hour, hour));
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
