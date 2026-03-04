import dict from './lang.js';

// Used for the selectors and for auto populating other structures
const cModels = {
    "TIR": {
        description: "TIR 2km",
        days: [-2, -1, 0, 1],
        hours: ["0800", "0900", "1000", "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900", "2000"],
        timezone: "Europe/Berlin",
    }
};

const cColorscales = {
    "rasp": {
        colors: ["#004dff", "#01f8e9", "#34c00c", "#f8fd00", "#ff9b00", "#ff1400"],
        values: [0, 0.2, 0.4, 0.6, 0.8, 1]
    },
    "bsratio": {
        colors: ["#00000040", "#00000020", "#00000020", "#00000000"],
        values: [0.2999999, 0.3, 0.6999999, 0.7]
    },
    "clouds": {
        colors: ["#ffffff00", "#000000ff"],
        values: [0, 1]
    },
    "clouds_low": {
        colors: ["#ff000000", "#ff0000ff"],
        values: [0, 1]
    },
    "clouds_mid": {
        colors: ["#00ff0000", "#00ff00ff"],
        values: [0, 1]
    },
    "clouds_high": {
        colors: ["#0000ff00", "#0000ffff"],
        values: [0, 1]
    },
    "cloudpotential": {
        colors: ["#053061", "#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#f7f7f7", "#fddbc7", "#f4a582", "#d6604d", "#b2182b", "#67001f"],
        values: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    },
    "verticalmotion": {
        colors: ["#053061", "#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#f7f7f7", "#fddbc7", "#f4a582", "#d6604d", "#b2182b", "#67001f"],
        values: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    },
    "pfd": {
        colors: ["#ffffff", "#fec6fe", "#fc64fc", "#7f93e2", "#2e5de5", "#009900", "#57fc00", "#ffe900", "#f08200", "#ae1700"],
        values: [0, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 1]
    }
};

const cParameters = {
    "thermal": {
        "wstar":         { longname: dict("wstar.longname"),         description: dict("wstar.description"), unit: "m/s", domain: [0, 500], mult: 100 },
        "bsratio":       { longname: dict("bsratio.longname"),       description: dict("bsratio.description"), unit: " ", domain: [0, 10] },
        "wstar_bsratio": { longname: dict("wstar_bsratio.longname"), description: dict("wstar_bsratio.description"),
                           composite: { of: ["wstar", "bsratio"], units: ["m/s", " "], domains: [[0, 500], [0, 10]], mults: [100, 1], type: "wstar_bsratio" }
                         },
        "hglider":       { longname: dict("hglider.longname"),       description: dict("hglider.description"), unit: "m", domain: [0, 3000] },
        "dglider":       { longname: dict("dglider.longname"),       description: dict("dglider.description"), unit: "m", domain: [0, 3000] },
        "hwcrit":        { longname: dict("hwcrit.longname"),        description: dict("hwcrit.description"), unit: "m", domain: [0, 3000] },
        "dwcrit":        { longname: dict("dwcrit.longname"),        description: dict("dwcrit.description"), unit: "m", domain: [0, 3000] },
        "hbl":           { longname: dict("hbl.longname"),           description: dict("hbl.description"), unit: "m", domain: [0, 3000] },
        "dbl":           { longname: dict("dbl.longname"),           description: dict("dbl.description"), unit: "m", domain: [0, 3000] },
        "bltopvariab":   { longname: dict("bltopvariab.longname"),   description: dict("bltopvariab.description"), unit: "m", domain: [0, 2000] },
        "wblmaxmin":     { longname: dict("wblmaxmin.longname"),     description: dict("wblmaxmin.description"), unit: "m/s", domain: [-250, 250], mult: 100, colorscale: "verticalmotion" },
        "zwblmaxmin":    { longname: dict("zwblmaxmin.longname"),    description: dict("zwblmaxmin.description"), unit: "m", domain: [0, 3000] },
    },
    "cloud": {
        "zsfclcldif":    { longname: dict("zsfclcldif.longname"),    description: dict("zsfclcldif.description"), unit: "m", domain: [-1000, 1000], colorscale: "cloudpotential" },
        "zsfclcl":       { longname: dict("zsfclcl.longname"),       description: dict("zsfclcl.description"), unit: "m", domain: [0, 3000] },
        "zsfclclmask":   { longname: dict("zsfclclmask.longname"),   description: dict("zsfclclmask.description"), unit: "m", domain: [0, 3000] },
        "zblcldif":      { longname: dict("zblcldif.longname"),      description: dict("zblcldif.description"), unit: "m", domain: [-1000, 1000], colorscale: "cloudpotential" },
        "zblcl":         { longname: dict("zblcl.longname"),         description: dict("zblcl.description"), unit: "m", domain: [0, 3000] },
        "zblclmask":     { longname: dict("zblclmask.longname"),     description: dict("zblclmask.description"), unit: "m", domain: [0, 3000] },
        "blcloudpct":    { longname: dict("blcloudpct.longname"),    description: dict("blcloudpct.description"), unit: "%", domain: [0, 100], colorscale: "clouds" },
        "cfracl":        { longname: dict("cfracl.longname"),        description: dict("cfracl.description"), unit: "%", domain: [0, 100], colorscale: "clouds" },
        "cfracm":        { longname: dict("cfracm.longname"),        description: dict("cfracm.description"), unit: "%", domain: [0, 100], colorscale: "clouds" },
        "cfrach":        { longname: dict("cfrach.longname"),        description: dict("cfrach.description"), unit: "%", domain: [0, 100], colorscale: "clouds" },
        "clouds":        { longname: dict("clouds.longname"),        description: dict("clouds.description"),
                           composite: { of: ["cfracl", "cfracm", "cfrach"], units: ["%", "%", "%"], domains: [[0, 100], [0, 100], [0, 100]], type: "clouds" }
                         },
    },
    "wind": {
        "sfcwind0":      { longname: dict("sfcwind0.longname"),      description: dict("sfcwind0.description"),
                           composite: { of: ["sfcwind0spd", "sfcwind0dir"], units: ["m/s", "°"], domains: [[0, 30]], type: "wind" }
                         },
        "sfcwind":       { longname: dict("sfcwind.longname"),       description: dict("sfcwind.description"),
                           composite: { of: ["sfcwindspd", "sfcwinddir"], units: ["m/s", "°"], domains: [[0, 30]], type: "wind" }
                         },
        "sfcwind2":      { longname: dict("sfcwind2.longname"),      description: dict("sfcwind2.description"),
                           composite: { of: ["sfcwind2spd", "sfcwind2dir"], units: ["m/s", "°"], domains: [[0, 30]], type: "wind" }
                         },
        "blwind":        { longname: dict("blwind.longname"),        description: dict("blwind.description"),
                           composite: { of: ["blwindspd", "blwinddir"], units: ["m/s", "°"], domains: [[0, 30]], type: "wind" }
                         },
        "bltopwind":     { longname: dict("bltopwind.longname"),     description: dict("bltopwind.description"),
                           composite: { of: ["bltopwindspd", "bltopwinddir"], units: ["m/s", "°"], domains: [[0, 30]], type: "wind" }
                         },
        "blwindshear":   { longname: dict("blwindshear.longname"),   description: dict("blwindshear.description"), unit: "m/s", domain: [0, 30] },
    },
    "wave": (hPa) => ({
        [`press${hPa}`]: {
            longname: `${dict("press.longname")} ${hPa}hPa`,
            description: dict("press.description"),
            composite: {
                of: [`press${hPa}`, `press${hPa}wspd`, `press${hPa}wdir`],
                units: ["m/s", "m/s", "°"],
                domains: [[-250, 250], [0, 30]],
                mults: [100, 1, 1],
                type: "press"
            }
        }
    }),
    "general": {
        "sfctemp":       { longname: dict("sfctemp.longname"),       description: dict("sfctemp.description"), unit: "°C", domain: [-10, 40] },
        "sfcdewpt":      { longname: dict("sfcdewpt.longname"),      description: dict("sfcdewpt.description"), unit: "°C", domain: [-20, 30] },
        "mslpress":      { longname: dict("mslpress.longname"),      description: dict("mslpress.description"), unit: "hPa", domain: [980, 1040] },
        "rain1":         { longname: dict("rain1.longname"),         description: dict("rain1.description"), unit: "mm/h", domain: [0, 10] },
        "cape":          { longname: dict("cape.longname"),          description: dict("cape.description"), unit: "J/kg", domain: [0, 2000] },
    },
    "experimental": {
        "pfd_tot":       { longname: dict("pfd_tot.longname"),       description: dict("pfd_tot.description"), unit: "km", domain: [0, 1000], wholeDay: true },
        "sfcsunpct":     { longname: dict("sfcsunpct.longname"),     description: dict("sfcsunpct.description"), unit: "%", domain: [0, 100] },
        "sfcshf":        { longname: dict("sfcshf.longname"),        description: dict("sfcshf.description"), unit: "W/m²", domain: [-50, 400] },
        "blicw":         { longname: dict("blicw.longname"),         description: dict("blicw.description"), unit: "g", domain: [0, 100] },
        "blcwbase":      { longname: dict("blcwbase.longname"),      description: dict("blcwbase.description"), unit: "m", domain: [0, 3000] },
    },
};

const cMeteograms = {
    "TIR": {
        // keys: "Someplace" -> meteogram_Someplace, ...
        "Tirschenreuth":      { name: "Tirschenreuth",     location: ["49.8741", "12.3272"]},
        "Oberhinkofen":       { name: "Oberhinkofen",      location: ["48.9523", "12.1462"]},
        "Bamberg":            { name: "Bamberg",           location: ["49.9179", "10.9121"]},
        "Jena":               { name: "Jena",              location: ["50.9164", "11.7171"]},
        "Noerdlingen":        { name: "Nördlingen",        location: ["48.8703", "10.5034"]},
        "Grossrueckerswalde": { name: "Großrückerswalde",  location: ["50.6431", "13.1274"]},
        "Klatovy":            { name: "Klatovy",           location: ["49.4172", "13.3215"]},
        "Wasserkuppe":        { name: "Wasserkuppe",       location: ["50.4989", "9.9541"]},
        "Sonnen":             { name: "Sonnen",            location: ["48.6823", "13.6949"]}
    }
};

// Define all static layers to be used in the map. Differentiate between mutually exclusive base layers ...
const cLayers = {
    baseLayers: {
        [dict("Topography")]: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; <a href="https://www.esri.com" target="_blank">Esri</a> &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
        }),
        [dict("Grayscale")]: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; <a href="https://www.esri.com" target="_blank">Esri</a> &mdash; Esri, DeLorme, NAVTEQ',
        })
    },
    // ... and overlays
    overlays: {
        [dict("Airspace")]: L.tileLayer('https://api.tiles.openaip.net/api/data/openaip/{z}/{x}/{y}.png?apiKey=decca790b0f2ea35ecd0534d2385b8b5', {
            attribution: 'Airspace by <a href="https://www.openaip.net" target="_blank">OpenAip</a>',
        })
    },
};

const cDefaults = {
    // The data is expected at forecastServerResults/OUT/<region>/<run date>/<day>
    forecastServerResults: "../results",
    baseLayer: dict("Topography"),
    overlays: [],
    zoom: 7,
    minZoom: 3,
    maxZoom: 14,
    model: "TIR",                          // default model to start on
    parameter: "wstar",                    // which paramter to start on
    startHour: '1300',
    opacityLevel: 0.7,
    loadingAnimationDelay: 100,            // ms. Wait this long before showing a loading animation for the to-be-shown overlay
    soundingMarker: 'img/sounding.svg',
    meteogramMarker: 'img/meteogram.svg',
    markerSize: 15
};

export { cModels, cColorscales, cParameters, cMeteograms, cLayers, cDefaults };
