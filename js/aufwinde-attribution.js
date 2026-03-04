import dict from '../lang.js';

L.Control.Attribution.Aufwinde = L.Control.Attribution.extend({
    addTo: function (map) {
        L.Control.Attribution.prototype.addTo.call(this, map);
        this._container.style.display = "none";
        var parent = this._container.parentNode;
        parent.onclick = event => event.stopPropagation();
        var aufwindeAttribution = document.createElement('div');
        aufwindeAttribution.innerHTML = "<a href='/'>aufwin.de</a>&nbsp;| <a href='/impressum.html'>" + dict("legalNotice") + "</a>&nbsp;· <a href='/datenschutz.html'>" + dict("privacyPolicy") + "</a>&nbsp;· <a href='.' onclick=\"localStorage.setItem('lang','de');\">DE</a>&nbsp;· <a href='.' onclick=\"localStorage.setItem('lang','en');\">EN</a>&nbsp;· <a href='https://github.com/sfalmo/rasp-viewer' target='_blank'>GitHub</a>&nbsp;· <a href='https://www.paypal.com/donate/?hosted_button_id=KU8658JS39LP8'>❤️ " + dict("Donate") + "</a>&nbsp;· ";
        aufwindeAttribution.classList.add('leaflet-control');
        aufwindeAttribution.classList.add('leaflet-control-attribution');
        var toggle = document.createElement('a');
        toggle.innerHTML = dict("attributionToggle");
        toggle.href = "#";
        toggle.onclick = () => {
            if (this._container.style.display == "none") {
                this._container.style.display = "block";
            } else {
                this._container.style.display = "none";
            }
        };
        aufwindeAttribution.appendChild(toggle);
        parent.insertBefore(aufwindeAttribution, parent.firstChild);
        return this._container;
    },
});

export default function(options) {
    return new L.Control.Attribution.Aufwinde(options);
}
