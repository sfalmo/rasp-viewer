<h1 align="center">RASP Viewer</h1>
<p align="center">A web app for visualizing RASP forecasts as seen on</p>
<p align="center"><a href="https://aufwin.de/"><img src="img/logo.svg" alt="aufwin.de logo"></a></p>

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

Bundle the javascript files with `npm run watch`, which will rebuild the bundle automatically when the source files are changed.
Spin up a web server and visit `localhost:8000` in your browser.
For convenience, `dev_server.sh` can be used for this if you have `uwsgi` and its Python plugin installed on your machine.
Alternatively, a simple `python -m http.server` or `php -S localhost:8000` will do, but you cannot use the interactive WSGI scripts (see below) in this case.

For production, run `npm run build`, which will build an optimized javascript bundle in the directory `bundle`.

### WSGI scripts

There are some Python scripts in `wsgi`, which generate useful analysis outputs such as cross sections or soundings dynamically from WRF output files.
To use them in production, you have to configure your web server accordingly.
Refer to the Readme in `wsgi`.
