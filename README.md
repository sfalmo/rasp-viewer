<p align="center">
  <h1 align="center">RASP Viewer</h1>
  <p align="center">A web app for visualizing RASP forecasts as seen on</p>
  <a href="https://aufwin.de/">
    <img src="img/logo.svg" alt="aufwin.de logo">
  </a>

  <h3 align="center">aufwin.de</h3>

</p>

## How do I get RASP forecasts?

This web app is a frontend for visualizing meteorological data obtained by running Dr. John W. "DrJack" Glendening's Regional Atmospheric Soaring Prediction (RASP) program.
RASP is a set of numerical weather prediction tools which are specialized to produce detailed weather forecasts for glider pilots.
To get started with RASP, check out [the official website](http://www.drjack.info/RASP/index.html) and [the RASP forum](http://www.drjack.info/cgi-bin/rasp-forum.cgi).

Forecasts such as the ones on [aufwin.de](aufwin.de) can be produced with assets contained in [this repository](https://github.com/sfalmo/rasp-from-scratch).

## Forecast Viewer

If you want to use this viewer for your own RASP forecasts, change the variables in `config.js` to your needs.
Most importantly, adapt the server root to the location of your RASP `results` directory (containing the forecasts for different regions and days).
Note that this can be a mere subfolder or symbolic link (e.g. `results`).

## Development

Spin up a web server (e.g. with `python -m http.server` or `php -S localhost:8000`) and visit `localhost:8000` (use the appropriate port) in your browser.
Then, in another terminal, execute `npm run watch`.
You can now do your programming and a javascript bundle will be built automatically on every change.

To bundle for production, run `npm run build`.
