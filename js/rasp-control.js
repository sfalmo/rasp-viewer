import * as GeoTIFF from 'geotiff';
import * as plotty from 'plotty';

import { cModels , cCategories , cParameters , cSoundings , cMeteograms , cLayers , cDefaults } from '../config.js';
import validIndicator from './valid-indicator.js';
import datetimeSelector from './datetime-selector.js';
import crosssectionControl from './crosssection-control.js';
import raspLayer from './rasp-layer.js';

L.Control.RASPControl = L.Control.extend({
    loadingAnimation: document.getElementById("loadingAnimation"),
    offcanvasContent: document.getElementById("offcanvasContent"),
    plot: document.getElementById("plot"),
    meteogramIcon: L.icon({
        iconUrl: cDefaults.meteogramMarker,
        iconSize: [cDefaults.markerSize, cDefaults.markerSize]
    }),
    soundingIcon: L.icon({
        iconUrl: cDefaults.soundingMarker,
        iconSize: [cDefaults.markerSize, cDefaults.markerSize]
    }),
    onAdd: function(map) {
        this.loadingAnimation.style.visibility = 'hidden';
        this._map = map;
        this._initPanel();

        this.raspLayer = raspLayer().addTo(map);
        this.validIndicator = validIndicator().addTo(map);

        this.plotCanvas = document.createElement('canvas');

        this.plot.onclick = e => {
            var button = e.target.closest('button');
            if (button && button.dataset.toggle == 'plotClose') {
                this.closePlot();
            }
        };
        this.plotContent = this.plot.getElementsByClassName("plotContent")[0];

        this.loadingMeta = false;
        this.loadingBlipmap = false;
        this.loadingPlot = false;

        this.datetimeSelector = datetimeSelector(this).addTo(map);
        this.datetimeSelector.init()
            .then(() => {
                this.modelDayChange();
            })
            .catch(() => {
                this.validIndicator.update(dict["dataMissing"], false);
            });

        return this._container;
    },
    _initPanel: function() {
        this._container = L.DomUtil.create('div', 'leaflet-control-layers rasp-control');
        this._link = L.DomUtil.create('a', 'leaflet-control-layers-toggle', this._container);
		    this._link.href = '#';
        this._link.title = 'RASP Control';
        if (!L.Browser.android) {
            L.DomEvent.on(this._link, 'mouseenter', this.expand, this);
        }
        if (L.Browser.touch) {
            L.DomEvent.on(this._link, 'click', L.DomEvent.stop);
            L.DomEvent.on(this._link, 'click', this.expand, this);
        } else {
            L.DomEvent.on(this._link, 'focus', this.expand, this);
        }
        this.expand();
        L.DomEvent.disableClickPropagation(this._container);
        L.DomEvent.disableScrollPropagation(this._container);
        this._raspPanel = L.DomUtil.create('div', "leaflet-control-layers-list", this._container);

        var parameterDiv = L.DomUtil.create('div', 'mb-2', this._raspPanel);
        this.parameterCategories = L.DomUtil.create('div', 'btn-group d-flex mb-1', parameterDiv);
        this.parameterCategories.setAttribute('data-bs-toggle', 'buttons');
        var defaultCategory = cParameters[cDefaults.parameter].category;
        for (const category of cCategories) {
            var catRadio = L.DomUtil.create('input', 'btn-check', this.parameterCategories);
            var catLabel = L.DomUtil.create('label', 'btn btn-outline-primary', this.parameterCategories);
            catRadio.name = "parameterCategory";
            catRadio.type = "radio";
            catRadio.value = category;
            catLabel.style.cursor = "pointer";
            catLabel.innerHTML += `<svg viewBox="0 0 12 12" class="parameterCategoryIcon"><use xlink:href="img/sprites.svg#${category}"></use></svg>`;
            catLabel.title = dict["parameterCategory_" + category + "_title"];
            catRadio.id = catLabel.title;
            catLabel.htmlFor = catRadio.id;
            if (category == defaultCategory) { // enable the default category
                catRadio.checked = true;
            }
        }
        this.parameterCategories.onchange = () => { this.parameterCategoryChange(); };
        this.parameterCategoryDescription = L.DomUtil.create('div', '', parameterDiv);
        this.parameterSelect = L.DomUtil.create('select', 'form-select form-select-sm fw-bold my-1', parameterDiv);
        this.parameterSelect.onchange = () => { this.parameterChange(); };
        this.parameterSelect.title = dict["parameterSelect_title"];
        var parameterDetails = L.DomUtil.create('details', '', parameterDiv);
        var parameterSummary = L.DomUtil.create('summary', '', parameterDetails);
        parameterSummary.title = dict["parameterDetails_title"];
        parameterSummary.innerHTML = dict["parameterDetails_summary"];
        this.parameterDescription = L.DomUtil.create('span', 'parameterDescription', parameterDetails);

        this.crosssectionControl = crosssectionControl(this);

        var miscControls = L.DomUtil.create('div', 'row align-items-center', this._raspPanel);
        var opacityDiv = L.DomUtil.create('div', 'col-auto btn-group', miscControls);
        var opacityDownButton = L.DomUtil.create('button', 'btn btn-sm btn-outline-secondary', opacityDiv);
        opacityDownButton.onclick = () => { this.raspLayer.opacityDown(); };
        opacityDownButton.title = dict["opacityDecreaseButton_title"];
        opacityDownButton.innerHTML = "−";
        var opacityIcon = L.DomUtil.create('span', 'btn btn-sm btn-outline-secondary disabled', opacityDiv);
        var opacityIconImg = L.DomUtil.create('img', 'icon', opacityIcon);
        opacityIconImg.src = 'img/opacity.svg';
        var opacityUpButton = L.DomUtil.create('button', 'btn btn-sm btn-outline-secondary', opacityDiv);
        opacityUpButton.onclick = () => { this.raspLayer.opacityUp(); };
        opacityUpButton.title = dict["opacityIncreaseButton_title"];
        opacityUpButton.innerHTML = "+";

        var soundingDiv = L.DomUtil.create('div', 'col-auto', miscControls);
        var soundingLabel = L.DomUtil.create('label', '', soundingDiv);
        soundingLabel.title = dict["soundingCheckbox_label"];
        this.soundingCheckbox = L.DomUtil.create('input', 'me-1', soundingLabel);
        this.soundingCheckbox.type = 'checkbox';
        this.soundingCheckbox.onchange = () => { this.toggleSoundingsOrMeteograms(); };
        var soundingText = L.DomUtil.create('span', '', soundingLabel);
        soundingText.innerHTML = dict["Soundings"];
        var meteogramDiv = L.DomUtil.create('div', 'col-auto', miscControls);
        var meteogramLabel = L.DomUtil.create('label', '', meteogramDiv);
        meteogramLabel.title = dict["meteogramCheckbox_label"];
        this.meteogramCheckbox = L.DomUtil.create('input', 'me-1', meteogramLabel);
        this.meteogramCheckbox.type = 'checkbox';
        this.meteogramCheckbox.onchange = () => { this.toggleSoundingsOrMeteograms(); };
        var meteogramText = L.DomUtil.create('span', '', meteogramLabel);
        meteogramText.innerHTML = dict["Meteograms"];

        this._collapseLink = L.DomUtil.create('a', 'leaflet-control-collapse-button', this._raspPanel);
        this._collapseLink.innerHTML = '⇱';
        this._collapseLink.title = 'Panel minimieren';
        this._collapseLink.href = '#';
        L.DomEvent.on(this._collapseLink, 'click', this.collapse, this);

        this.togglePanelOrOffcanvas();
        window.addEventListener('resize', () => { this.togglePanelOrOffcanvas(); });
    },
    toOffcanvas: function() {
        L.DomEvent.off(this._link, 'mouseenter', this.expand, this);
        this._link.href = "#offcanvas";
        this._link.setAttribute("data-bs-toggle", "offcanvas");
        this.collapse();
        this.isOffcanvas = true;
        this.offcanvasContent.appendChild(this._raspPanel);
        this._collapseLink.style.display = "none";
    },
    toPanel: function() {
        this._container.appendChild(this.offcanvasContent.children[0]);
        this._collapseLink.style.display = "block";
        var offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById("offcanvas"));
        if (offcanvas) {
            offcanvas.hide();
        }
        this.isOffcanvas = false;
        this.expand();
        this._link.removeAttribute("data-bs-toggle");
        this._link.href = "#";
        L.DomEvent.on(this._link, 'mouseenter', this.expand, this);
    },
    togglePanelOrOffcanvas: function() {
        if (window.innerWidth < 768 && !this.isOffcanvas) {
            this.toOffcanvas();
        }
        if (window.innerWidth > 768 && this.isOffcanvas) {
            this.toPanel();
        }
    },
    expand: function () {
        if (!this.isOffcanvas) {
            L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
        }
    },
    collapse: function () {
        if (!this.isOffcanvas) {
            L.DomUtil.removeClass(this._container, 'leaflet-control-layers-expanded');
        }
    },
    getDataUrls: function(modelDir, parameterKey, time) {
        var baseUrls = [cDefaults.forecastServerResults + "/OUT/" + modelDir + "/" + parameterKey + "."]; // Default (no composite parameter)
        if (cParameters[parameterKey].composite) {
            baseUrls = cParameters[parameterKey].composite.of.map(key => cDefaults.forecastServerResults + "/OUT/" + modelDir + "/" + key + ".");
        }
        if (parameterKey != "pfd_tot") { // Almost all parameters are time-dependent, PFD being the exception
            baseUrls = baseUrls.map(base => base + "curr."+time+"lst.d2.");
        }
        var geotiffUrls = baseUrls.map(base => base + "data.tiff");
        var metaUrl = baseUrls[0] + "title.json";
        return {geotiffUrls: geotiffUrls, metaUrl: metaUrl};
    },
    getParameterCategory: function() {
        return this.parameterCategories.querySelector("input:checked").value;
    },
    doParameterList: function() {
        var currentParameter = this.parameterSelect.value;
        this.parameterSelect.options.length = 0; // Clear all parameters
        var category = this.getParameterCategory();
        for (const parameter of cModels[this.datetimeSelector.get().model].parameters) {
            if (cParameters[parameter].category == category) {
                this.parameterSelect.add(new Option(cParameters[parameter].longname, parameter));
                if (!currentParameter && parameter == cDefaults.parameter || parameter == currentParameter) {
                    this.parameterSelect.options[this.parameterSelect.options.length - 1].selected = true;
                }
            }
        }
    },
    modelDayChange: function() {
        var model = this.datetimeSelector.get().model;
        var dir = this.datetimeSelector.get().dir;
        if (this.soundingOverlay) {
            this.soundingOverlay.remove();
        }
        if (this.meteogramOverlay) {
            this.meteogramOverlay.remove();
        }
        this.soundingOverlay = this.getSoundingMarkers(model);
        this.meteogramOverlay = this.getMeteogramMarkers(model);
        this.toggleSoundingsOrMeteograms();
        this.doParameterList(); // could have different parameters
        this.parameterCategoryChange();
        if (this.currentPlot && this.currentPlot.type == "meteogram") {
            this.currentPlot.imageUrl = cDefaults.forecastServerResults + "/OUT/" + dir + "/meteogram_" + this.currentPlot.key + ".png";
            this.currentPlot.image.src = this.currentPlot.imageUrl;
        }
    },
    parameterCategoryChange: function() {
        var category = this.getParameterCategory();
        this.parameterCategoryDescription.innerHTML = dict["parameterCategory_" + category + "_title"];
        this.doParameterList();
        this.parameterChange();
    },
    parameterChange: function() {
        this.parameterDescription.innerHTML = cParameters[this.parameterSelect.value].description;
        this.update();
    },
    _loading: function() {
        return this.loadingMeta || this.loadingBlipmap || this.loadingPlot;
    },
    _armLoadingAnimation: function() {
        setTimeout(() => {
            if (this._loading()) {
                this.loadingAnimation.style.visibility = "visible";
            }
        }, cDefaults.loadingAnimationDelay);
    },
    _hideLoadingAnimationMaybe: function() {
        if (!this._loading()) {
            this.loadingAnimation.style.visibility = "hidden";
        }
    },
    update: function() {
        var {model, runDate, day, time, dir} = this.datetimeSelector.get();
        var parameterKey = this.parameterSelect.value;
        var parameter = cParameters[parameterKey];
        var urls = this.getDataUrls(dir, parameterKey, time);
        this._updateBlipmap(urls.geotiffUrls, parameter);
        if (this.currentPlot && this.currentPlot.type == "sounding") {
            this.currentPlot.imageUrl = cDefaults.forecastServerResults + "/OUT/" + dir + "/sounding" + this.currentPlot.key + ".curr." + time + "lst.d2.png";
            this.currentPlot.image.src = this.currentPlot.imageUrl;
        }
        this._updateMeta(urls.metaUrl, parameter.longname, day);
    },
    _updateMeta: function(metaUrl, parameterLongname, day) {
        fetch(metaUrl)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw Error("metadataMissing");
                }
            })
            .then(validJson => {
                var validDateText = `${validJson["year"]}-${validJson["month"]}-${validJson["day"]}`;
                var runDateText = this.datetimeSelector.get().runDate;
                var timezone = dict[validJson["timezone"]];
                var validTimestamp = `${validDateText} ${validJson["validLocal"]} ${timezone} (${validJson["validZulu"]}Z)`;
                this.validIndicator.update(`${dict["Model run"]} ${runDateText} ${validJson["fcstZulu"]}Z ${dict["for"]} ${validTimestamp}`, true);
            })
            .catch(err => {
                this.validIndicator.update(dict[err.message] ? dict[err.message] : err.message, false);
            })
            .finally(() => {
                this.loadingMeta = false;
                this._hideLoadingAnimationMaybe();
            });
        this.loadingMeta = true;
        this._armLoadingAnimation();
    },
    _updateBlipmap: function(geotiffUrls, parameter) {
        Promise.all(geotiffUrls.map(url => fetch(url)))
            .then(responses => {
                if (responses.every(response => response.ok)) {
                    return Promise.all(responses.map(response => response.arrayBuffer()));
                } else {
                    throw Error("dataMissing");
                }
            })
            .then(buffers => {
                return Promise.all(buffers.map(GeoTIFF.fromArrayBuffer));
            })
            .then(geotiffs => {
                return Promise.all(geotiffs.map(geotiff => geotiff.getImage()));
            })
            .then(images => {
                this.raspLayer.update(images, parameter);
            })
            .catch(err => {
                this.raspLayer.invalidate();
            })
            .finally(() => {
                this.loadingBlipmap = false;
                this._hideLoadingAnimationMaybe();
            });
        this.loadingBlipmap = true;
        this._armLoadingAnimation();
    },
    toggleSoundingsOrMeteograms: function() {
        if (this.soundingCheckbox.checked) {
            this.soundingOverlay.addTo(this._map);
        } else {
            if (this.currentPlot && this.currentPlot.type == "sounding") {
                this.closePlot();
            }
            this.soundingOverlay.remove();
        }
        if (this.meteogramCheckbox.checked) {
            this.meteogramOverlay.addTo(this._map);
        } else {
            if (this.currentPlot && this.currentPlot.type == "meteogram") {
                this.closePlot();
            }
            this.meteogramOverlay.remove();
        }
    },
    closePlot: function() {
        this.plot.style.display = "none";
        this._map.invalidateSize();
        this.currentPlot = null;
    },
    updatePlot: function() {
        this.plot.style.display = "";
        this.plotContent.innerHTML = "";
        if (this.currentPlot.type == "meteogram" || this.currentPlot.type == "sounding") {
            this.currentPlot.image.style.objectFit = "contain";
            this.plotContent.appendChild(this.currentPlot.image);
        }
        this.loadingPlot = false;
        this._hideLoadingAnimationMaybe();
    },
    getSoundingMarkers: function(modelKey) {
        var markers = [];
        var soundings = cSoundings[modelKey];
        for (const soundingKey of Object.keys(soundings)) {
            var sounding = soundings[soundingKey];
            markers.push(
                L.marker(sounding.location, {icon: this.soundingIcon})
                    .bindTooltip(sounding.name)
                    .on('click', e => {
                        var dir = this.datetimeSelector.get().dir;
                        var time = this.datetimeSelector.get().time;
                        this.currentPlot = {type: "sounding", key: soundingKey};
                        this.currentPlot.imageUrl = cDefaults.forecastServerResults + "/OUT/" + dir + "/sounding" + soundingKey + ".curr." + time + "lst.d2.png";
                        this.currentPlot.image = new Image();
                        this.currentPlot.image.onload = () => {
                            this.updatePlot();
                        };
                        this.currentPlot.image.src = this.currentPlot.imageUrl;
                        this.loadingPlot = true;
                        this._armLoadingAnimation();
                    })
            );
        }
        return L.layerGroup(markers);
    },
    getMeteogramMarkers: function(modelKey) {
        var markers = [];
        var meteograms = cMeteograms[modelKey];
        for (const meteogramKey of Object.keys(meteograms)) {
            var meteogram = meteograms[meteogramKey];
            markers.push(
                L.marker(meteogram.location, {icon: this.meteogramIcon})
                    .bindTooltip(meteogram.name)
                    .on('click', e => {
                        var dir = this.datetimeSelector.get().dir;
                        var time = this.datetimeSelector.get().time;
                        this.currentPlot = {type: "meteogram", key: meteogramKey};
                        this.currentPlot.imageUrl = cDefaults.forecastServerResults + "/OUT/" + dir + "/meteogram_" + meteogramKey + ".png";
                        this.currentPlot.image = new Image();
                        this.currentPlot.image.onload = () => {
                            this.updatePlot();
                        };
                        this.currentPlot.image.src = this.currentPlot.imageUrl;
                        this.loadingPlot = true;
                        this._armLoadingAnimation();
                    })
            );
        }
        return L.layerGroup(markers);
    }
});

export default function(options) {
    return new L.Control.RASPControl(options);
};
