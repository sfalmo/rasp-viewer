import { cModels , cParameters , cSoundings , cMeteograms , cLayers , cDefaults } from './config.js';

import aufwindeAttribution from './js/aufwinde-attribution.js';
import raspControl from './js/rasp-control.js';

// Create the map
var map = L.map('map', {
    center: cModels[cDefaults.model].center,
    attributionControl: false,
    zoom: cDefaults.zoom,
    minZoom: cDefaults.minZoom,
    maxZoom: cDefaults.maxZoom,
    zoomControl: false,
    doubleClickZoom: false,
    wheelPxPerZoomLevel: 120,
    zoomDelta: 0.5,
    zoomSnap: 0
});
// Add default controls
// L.control.scale({position: cDefaults.scaleLocation}).addTo(map);
// L.control.zoom({position: cDefaults.zoomLocation}).addTo(map);

aufwindeAttribution({position: 'bottomleft'}).addTo(map);

var logo = L.control({position: 'bottomleft'});
logo.onAdd = function(map){
    var div = L.DomUtil.create('div', 'logo');
    div.innerHTML= "<img width='80' src='img/logo.svg'>";
    return div;
};
logo.addTo(map);

cLayers.baseLayers[cDefaults.baseLayer].addTo(map);
for (const overlay of cDefaults.overlays) {
    cLayers.overlays[overlay].addTo(map);
}

// This sets up all RASP related controls and layers
raspControl({position: cDefaults.RASPControlLocation}).addTo(map);
L.control.layers(cLayers.baseLayers, cLayers.overlays, {position: cDefaults.layersLocation}).addTo(map);

// Leaflet needs this because the flexbox it is in does not evaluate to the right height at the beginning
// Otherwise, bottom tiles are not loaded (because leaflet thinks they are outside of the viewport)
window.onload = () => { map.invalidateSize(); };
