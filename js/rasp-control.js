import parseGeoraster from 'georaster';

import { cModels , cCategories , cParameters , cSoundings , cMeteograms , cLayers , cDefaults } from '../config.js';
import validIndicator from './valid-indicator.js';
import datetimeSelector from './datetime-selector.js';
import raspLayer from './rasp-layer.js';

L.Control.RASPControl = L.Control.extend({
    loadingAnimation: document.getElementById("loadingAnimation"),
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

        this.loadingMeta = false;
        this.loadingPlot = false;

        this._map.on('popupclose', e => {
            this.currentPopup = null;
        });

        this.datetimeSelector = datetimeSelector(this).addTo(map);
        this.datetimeSelector.init()
            .then(() => {
                this.modelDayChange();
            });

        return this._container;
    },
    _initPanel: function() {
        this._container = L.DomUtil.create('div', 'leaflet-control-layers rasp-control');
        if (!L.Browser.android) {
            L.DomEvent.on(this._container, {
                mouseenter: this.expand,
            }, this);
        }
        this._link = L.DomUtil.create('a', 'leaflet-control-layers-toggle', this._container);
		    this._link.href = '#';
        this._link.title = 'RASP Control';
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
        this.parameterCategories = L.DomUtil.create('div', 'btn-group mb-1', parameterDiv);
        this.parameterCategories.setAttribute('data-bs-toggle', 'buttons');
        var defaultCategory = cParameters[cDefaults.parameter].category;
        for (const category of cCategories) {
            var catRadio = L.DomUtil.create('input', 'btn-check', this.parameterCategories);
            var catLabel = L.DomUtil.create('label', 'btn btn-outline-primary', this.parameterCategories);
            catRadio.name = "parameterCategory";
            catRadio.type = "radio";
            catRadio.value = category;
            catLabel.style.cursor = "pointer";
            // catLabel.innerHTML += `<img class='parameterCategoryIcon' src='img/${category}.svg'>`;
            catLabel.innerHTML += `
<svg class="parameterCategoryIcon">
  <use xlink:href="img/sprites.svg#${category}"></use>
</svg>
`;
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
    },
    onRemove: function(map) {
        // Nothing to do here
    },
    expand: function () {
        L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
        return this;
    },
    collapse: function () {
        L.DomUtil.removeClass(this._container, 'leaflet-control-layers-expanded');
        return this;
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
        this.parameterChange();
        if (this.currentPopup && this.currentPopup.type == "meteogram") {
            this.currentPopup.imageUrl = cDefaults.forecastServerResults + "/OUT/" + dir + "/meteogram_" + this.currentPopup.key + ".png";
            this.currentPopup.image.src = this.currentPopup.imageUrl;
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
        return this.loadingMeta || this.loadingPlot || (this.currentPopup && !this.currentPopup.image.complete);
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
        this._updatePlot(urls.geotiffUrls, parameter);
        if (this.currentPopup && this.currentPopup.type == "sounding") {
            this.currentPopup.imageUrl = cDefaults.forecastServerResults + "/OUT/" + dir + "/sounding" + this.currentPopup.key + ".curr." + time + "lst.d2.png";
            this.currentPopup.image.src = this.currentPopup.imageUrl;
        }
        this._updateMeta(urls.metaUrl, parameter.longname, day);
        setTimeout(() => {
            if (this._loading()) {
                this.loadingAnimation.style.visibility = "visible";
            }
        }, cDefaults.loadingAnimationDelay);
    },
    _updateMeta: function(metaUrl, parameterLongname, day) {
        this.loadingMeta = true;
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
    },
    _updatePlot: function(geotiffUrls, parameter) {
        this.loadingPlot = true;
        Promise.all(geotiffUrls.map(url => fetch(url)))
            .then(responses => {
                if (responses.every(response => response.ok)) {
                    return Promise.all(responses.map(response => response.arrayBuffer()));
                } else {
                    throw Error("dataMissing");
                }
            })
            .then(buffers => {
                return Promise.all(buffers.map(parseGeoraster));
            })
            .then(georasters => {
                this.raspLayer.update(georasters, parameter);
            })
            .catch(err => {
                this.raspLayer.invalidate();
            })
            .finally(() => {
                this.loadingPlot = false;
                this._hideLoadingAnimationMaybe();
            });
    },
    toggleSoundingsOrMeteograms: function() {
        if (this.soundingCheckbox.checked) {
            this.soundingOverlay.addTo(this._map);
        } else {
            if (this.currentPopup && this.currentPopup.type == "sounding") {
                this.currentPopup.popup.remove();
            }
            this.soundingOverlay.remove();
        }
        if (this.meteogramCheckbox.checked) {
            this.meteogramOverlay.addTo(this._map);
        } else {
            if (this.currentPopup && this.currentPopup.type == "meteogram") {
                this.currentPopup.popup.remove();
            }
            this.meteogramOverlay.remove();
        }
    },
    updatePopup: function() {
        var popupContent = document.createElement('div');
        var popupLink = document.createElement("A");
        popupLink.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 48 48'><path d='M38 38H10V10h14V6H10c-2.21 0-4 1.79-4 4v28c0 2.21 1.79 4 4 4h28c2.21 0 4-1.79 4-4V24h-4v14zM28 6v4h7.17L15.51 29.66l2.83 2.83L38 12.83V20h4V6H28z'/></svg>";
        popupLink.href = this.currentPopup.imageUrl;
        popupLink.title = dict["Show in separate window"];
        popupLink.target = "_blank";
        popupContent.appendChild(popupLink);
        popupContent.appendChild(this.currentPopup.image);
        this.currentPopup.popup.setContent(popupContent);
        this.loadingAnimation.style.visibility = "hidden";
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
                        this.currentPopup = {type: "sounding", key: soundingKey};
                        this.currentPopup.imageUrl = cDefaults.forecastServerResults + "/OUT/" + dir + "/sounding" + soundingKey + ".curr." + time + "lst.d2.png";
                        this.currentPopup.popup = L.popup({maxWidth: "auto"})
                            .setLatLng(e.target.getLatLng())
                            .openOn(this._map);
                        this.currentPopup.image = new Image();
                        this.currentPopup.image.setAttribute("class", "imagePopup");
                        this.currentPopup.image.onload = () => {
                            this.updatePopup();
                        };
                        this.currentPopup.image.src = this.currentPopup.imageUrl;
                        setTimeout(() => {
                            if (!this.currentPopup.image.complete) {
                                this.loadingAnimation.style.visibility = "visible";
                            }
                        }, cDefaults.loadingAnimationDelay);
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
                        this.currentPopup = {type: "meteogram", key: meteogramKey};
                        this.currentPopup.imageUrl = cDefaults.forecastServerResults + "/OUT/" + dir + "/meteogram_" + meteogramKey + ".png";
                        this.currentPopup.popup = L.popup({maxWidth: "auto"})
                            .setLatLng(e.target.getLatLng())
                            .openOn(this._map);
                        this.currentPopup.image = new Image();
                        this.currentPopup.image.setAttribute("class", "imagePopup");
                        this.currentPopup.image.onload = () => {
                            this.updatePopup();
                        };
                        this.currentPopup.image.src = this.currentPopup.imageUrl;
                        setTimeout(() => {
                            if (!this.currentPopup.image.complete) {
                                this.loadingAnimation.style.visibility = "visible";
                            }
                        }, cDefaults.loadingAnimationDelay);
                    })
            );
        }
        return L.layerGroup(markers);
    }
});

export default function(options) {
    return new L.Control.RASPControl(options);
};
