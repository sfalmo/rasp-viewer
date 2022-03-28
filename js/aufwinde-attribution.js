L.Control.Attribution.Aufwinde = L.Control.Attribution.extend({
    addTo: function (map) {
        L.Control.Attribution.prototype.addTo.call(this, map);
        this._container.style.display = "none";
        var parent     = this._container.parentNode;
        parent.onclick = event => event.stopPropagation();
        var aufwindeAttribution   = document.createElement('div');
        aufwindeAttribution.innerHTML = "<a href='/'>aufwin.de</a> | <a href='/impressum.html'>" + dict("legalNotice") + "</a> - <a href='/datenschutz.html'>" + dict("privacyPolicy") + "</a> - <a href='.' onclick=\"localStorage.setItem('lang','de');\">DE</a> - <a href='.' onclick=\"localStorage.setItem('lang','en');\">EN</a> - <a href='https://github.com/sfalmo/rasp-viewer' target='_blank'>GitHub</a> - ";
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
        return this;
    },
});

export default function(options) {
    return new L.Control.Attribution.Aufwinde(options);
}
