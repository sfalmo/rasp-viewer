import dict from './lang.js';
import { cModels , cLayers , cDefaults } from './config.js';

import aufwindeAttribution from './js/aufwinde-attribution.js';
import raspControl from './js/rasp-control.js';

document.title = dict("forecastTitle");

// Create the map
var map = L.map('map', {
    center: [50.2, 11.2], // need to set some default, actual center will be determined from model parameters
    attributionControl: false,
    zoom: cDefaults.zoom,
    minZoom: cDefaults.minZoom,
    maxZoom: cDefaults.maxZoom,
    zoomControl: false,
    doubleClickZoom: false,
    wheelPxPerZoomLevel: 60,
    zoomDelta: 1.0,
    zoomSnap: 0
});

aufwindeAttribution({position: 'bottomleft'}).addTo(map);

var logo = L.control({position: 'bottomleft'});
logo.onAdd = function(map){
    var div = L.DomUtil.create('div', 'logo');
    div.innerHTML= "<img width='80' src='img/logo.svg'>";
    return div;
};
logo.addTo(map);

map.createPane('airspacePane');
map.getPane('airspacePane').style.zIndex = 402; // overlayPane is 400, windbarbPane is 401

cLayers.baseLayers[cDefaults.baseLayer].addTo(map);
for (const overlay of cDefaults.overlays) {
    cLayers.overlays[overlay].addTo(map);
}

// This sets up all RASP related controls and layers
var rc = raspControl({position: 'topleft'}).addTo(map);
L.control.layers(cLayers.baseLayers, cLayers.overlays, {position: 'topleft'}).addTo(map);

// Leaflet needs this because the flexbox it is in does not evaluate to the right height at the beginning
// Otherwise, bottom tiles are not loaded (because leaflet thinks they are outside of the viewport)
window.onload = () => { map.invalidateSize(); };
