// Used for the selectors and for auto populating other structures
const cModels = {
    "TIR": {
        "description": "TIR 2km",
        "center":   ["50", "12"],
        "resolution": 2, // in km
        "days": [-1, 0, 1],
        "hours": ["0800", "0900", "1000", "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900", "2000"],
        "timezone": "Europe/Berlin",
        "zoom": 7,
        "parameters": [
            // Thermal
            "wstar",
            "bsratio",
            "wstar_bsratio",
            "hglider",
            "dglider",
            "hwcrit",
            "dwcrit",
            "hbl",
            "dbl",
            "bltopvariab",
            "wblmaxmin",
            "zwblmaxmin",

            // Cloud
            "zsfclcldif",
            "zsfclcl",
            "zsfclclmask",
            "zblcldif",
            "zblcl",
            "zblclmask",
            "clouds",
            "blcloudpct",
            "cfracl",
            "cfracm",
            "cfrach",

            // Wind
            "sfcwind0",
            // "sfcwind",
            "blwind",
            "bltopwind",
            "blwindshear",

            // Wave
            "press950",
            "press850",
            "press700",
            "press500",

            // General
            "sfctemp",
            "sfcdewpt",
            // "mslpress",
            "rain1",
            "cape",

            // Experimental
            "pfd_tot",
            "sfcsunpct",
            "sfcshf",
            "blicw",
            "blcwbase",
        ]
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
        colors: ["#ffffff", "#000000"],
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
        colors: ["#004dff", "#ffffbf", "#ff1400"],
        values: [0, 0.5, 1]
    },
    "verticalmotion": {
        colors: ["#004dff", "#ffffbf", "#ff1400"],
        values: [0, 0.5, 1]
    },
    "pfd": {
        colors: ["#ffffff", "#fec6fe", "#fc64fc", "#7f93e2", "#2e5de5", "#009900", "#57fc00", "#ffe900", "#f08200", "#ae1700"],
        values: [0, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 1]
    }
};

const cCategories = ["thermal", "cloud", "wind", "wave", "general", "experimental"];

const cParameters = {
    // Thermal
    "wstar":         { category: "thermal", "longname": dict("wstar.longname"),         "description": dict("wstar.description"), unit: "cm/s", domain: [0, 500] },
    "bsratio":       { category: "thermal", "longname": dict("bsratio.longname"),       "description": dict("bsratio.description"), unit: " ", domain: [0, 10] },
    "wstar_bsratio": { category: "thermal", "longname": dict("wstar_bsratio.longname"), "description": dict("wstar_bsratio.description"),
                       composite: { of: ["wstar", "bsratio"], units: ["cm/s", " "], domains: [[0, 500], [0, 10]], type: "wstar_bsratio" }
                     },
    "hglider":       { category: "thermal", "longname": dict("hglider.longname"),       "description": dict("hglider.description"), unit: "m", domain: [0, 3000] },
    "dglider":       { category: "thermal", "longname": dict("dglider.longname"),       "description": dict("dglider.description"), unit: "m", domain: [0, 3000] },
    "hwcrit":        { category: "thermal", "longname": dict("hwcrit.longname"),        "description": dict("hwcrit.description"), unit: "m", domain: [0, 3000] },
    "dwcrit":        { category: "thermal", "longname": dict("dwcrit.longname"),        "description": dict("dwcrit.description"), unit: "m", domain: [0, 3000] },
    "hbl":           { category: "thermal", "longname": dict("hbl.longname"),           "description": dict("hbl.description"), unit: "m", domain: [0, 3000] },
    "dbl":           { category: "thermal", "longname": dict("dbl.longname"),           "description": dict("dbl.description"), unit: "m", domain: [0, 3000] },
    "bltopvariab":   { category: "thermal", "longname": dict("bltopvariab.longname"),   "description": dict("bltopvariab.description"), unit: "m", domain: [0, 2000] },
    "wblmaxmin":     { category: "thermal", "longname": dict("wblmaxmin.longname"),     "description": dict("wblmaxmin.description"), unit: "cm/s", domain: [-250, 250], colorscale: "verticalmotion" },
    "zwblmaxmin":    { category: "thermal", "longname": dict("zwblmaxmin.longname"),    "description": dict("zwblmaxmin.description"), unit: "m", domain: [0, 3000] },
    // Cloud
    "zsfclcldif":    { category: "cloud", "longname": dict("zsfclcldif.longname"),    "description": dict("zsfclcldif.description"), unit: "m", domain: [-1000, 1000], colorscale: "cloudpotential" },
    "zsfclcl":       { category: "cloud", "longname": dict("zsfclcl.longname"),       "description": dict("zsfclcl.description"), unit: "m", domain: [0, 3000] },
    "zsfclclmask":   { category: "cloud", "longname": dict("zsfclclmask.longname"),   "description": dict("zsfclclmask.description"), unit: "m", domain: [0, 3000] },
    "zblcldif":      { category: "cloud", "longname": dict("zblcldif.longname"),      "description": dict("zblcldif.description"), unit: "m", domain: [-1000, 1000], colorscale: "cloudpotential" },
    "zblcl":         { category: "cloud", "longname": dict("zblcl.longname"),         "description": dict("zblcl.description"), unit: "m", domain: [0, 3000] },
    "zblclmask":     { category: "cloud", "longname": dict("zblclmask.longname"),     "description": dict("zblclmask.description"), unit: "m", domain: [0, 3000] },
    "blcloudpct":    { category: "cloud", "longname": dict("blcloudpct.longname"),    "description": dict("blcloudpct.description"), unit: "%", domain: [0, 100], colorscale: "clouds" },
    "cfracl":        { category: "cloud", "longname": dict("cfracl.longname"),        "description": dict("cfracl.description"), unit: "%", domain: [0, 100], colorscale: "clouds" },
    "cfracm":        { category: "cloud", "longname": dict("cfracm.longname"),        "description": dict("cfracm.description"), unit: "%", domain: [0, 100], colorscale: "clouds" },
    "cfrach":        { category: "cloud", "longname": dict("cfrach.longname"),        "description": dict("cfrach.description"), unit: "%", domain: [0, 100], colorscale: "clouds" },
    "clouds":        { category: "cloud", "longname": dict("clouds.longname"),        "description": dict("clouds.description"),
                       composite: { of: ["cfracl", "cfracm", "cfrach"], units: ["%", "%", "%"], domains: [[0, 100], [0, 100], [0, 100]], type: "clouds" }
                     },
    // Wind
    "sfcwind0":      { category: "wind", "longname": dict("sfcwind0.longname"),      "description": dict("sfcwind0.description"),
                       composite:{ of: ["sfcwind0spd", "sfcwind0dir"], units: ["m/s", "°"], domains: [[0, 30]], type: "wind" }
                     },
    "sfcwind":       { category: "wind", "longname": dict("sfcwind.longname"),       "description": dict("sfcwind.description"),
                       composite: { of: ["sfcwindspd", "sfcwinddir"], units: ["m/s", "°"], domains: [[0, 30]], type: "wind" }
                     },
    "blwind":        { category: "wind", "longname": dict("blwind.longname"),        "description": dict("blwind.description"),
                       composite: { of: ["blwindspd", "blwinddir"], units: ["m/s", "°"], domains: [[0, 30]], type: "wind" }
                     },
    "bltopwind":     { category: "wind", "longname": dict("bltopwind.longname"),     "description": dict("bltopwind.description"),
                       composite: { of: ["bltopwindspd", "bltopwinddir"], units: ["m/s", "°"], domains: [[0, 30]], type: "wind" }
                     },
    "blwindshear":   { category: "wind", "longname": dict("blwindshear.longname"),   "description": dict("blwindshear.description"), unit: "m/s", domain: [0, 30] },
    // Wave
    "press950":      { category: "wave", "longname": dict("press950.longname"),      "description": dict("press950.description"),
                       composite: { of: ["press950", "press950wspd", "press950wdir"], units: ["cm/s", "m/s", "°"], domains: [[-250, 250], [0, 30]], type: "press" }
                     },
    "press850":      { category: "wave", "longname": dict("press850.longname"),      "description": dict("press850.description"),
                       composite: { of: ["press850", "press850wspd", "press850wdir"], units: ["cm/s", "m/s", "°"], domains: [[-250, 250], [0, 30]], type: "press" }
                     },
    "press700":      { category: "wave", "longname": dict("press700.longname"),      "description": dict("press700.description"),
                       composite: { of: ["press700", "press700wspd", "press700wdir"], units: ["cm/s", "m/s", "°"], domains: [[-250, 250], [0, 30]], type: "press" }
                     },
    "press500":      { category: "wave", "longname": dict("press500.longname"),      "description": dict("press500.description"),
                       composite: { of: ["press500", "press500wspd", "press500wdir"], units: ["cm/s", "m/s", "°"], domains: [[-250, 250], [0, 30]], type: "press" }
                     },
    // General
    "sfctemp":       { category: "general", "longname": dict("sfctemp.longname"),       "description": dict("sfctemp.description"), unit: "°C", domain: [-10, 40] },
    "sfcdewpt":      { category: "general", "longname": dict("sfcdewpt.longname"),      "description": dict("sfcdewpt.description"), unit: "°C", domain: [-20, 30] },
    "mslpress":      { category: "general", "longname": dict("mslpress.longname"),      "description": dict("mslpress.description"), unit: "hPa" },
    "rain1":         { category: "general", "longname": dict("rain1.longname"),         "description": dict("rain1.description"), unit: "mm/h", domain: [0, 10] },
    "cape":          { category: "general", "longname": dict("cape.longname"),          "description": dict("cape.description"), unit: "J/kg", domain: [0, 2000] },
    // Experimental
    "pfd_tot":       { category: "experimental", "longname": dict("pfd_tot.longname"),       "description": dict("pfd_tot.description"), unit: "km", domain: [0, 1000], colorscale: "pfd" },
    "sfcsunpct":     { category: "experimental", "longname": dict("sfcsunpct.longname"),     "description": dict("sfcsunpct.description"), unit: "%", domain: [0, 100] },
    "sfcshf":        { category: "experimental", "longname": dict("sfcshf.longname"),        "description": dict("sfcshf.description"), unit: "W/m²", domain: [-50, 400] },
    "blicw":         { category: "experimental", "longname": dict("blicw.longname"),         "description": dict("blicw.description"), unit: "g", domain: [0, 100] },
    "blcwbase":      { category: "experimental", "longname": dict("blcwbase.longname"),      "description": dict("blcwbase.description"), unit: "m", domain: [0, 3000] },
};

const cMeteograms = {
    "TIR": {
        // keys: "Someplace" -> meteogram_Someplace, ...
        "Tirschenreuth":      { "name": "Tirschenreuth",     "location": ["49.8741", "12.3272"]},
        "Oberhinkofen":       { "name": "Oberhinkofen",      "location": ["48.9523", "12.1462"]},
        "Bamberg":            { "name": "Bamberg",           "location": ["49.9179", "10.9121"]},
        "Jena":               { "name": "Jena",              "location": ["50.9164", "11.7171"]},
        "Noerdlingen":        { "name": "Nördlingen",        "location": ["48.8703", "10.5034"]},
        "Grossrueckerswalde": { "name": "Großrückerswalde",  "location": ["50.6431", "13.1274"]},
        "Klatovy":            { "name": "Klatovy",           "location": ["49.4172", "13.3215"]},
        "Wasserkuppe":        { "name": "Wasserkuppe",       "location": ["50.4989", "9.9541"]},
        "Sonnen":             { "name": "Sonnen",            "location": ["48.6823", "13.6949"]}
    }
};

// Define all static layers to be used in the map. Differentiate between mutually exclusive base layers ...
const cLayers = {
    baseLayers: {
        [dict("Topography")]: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Powered by <a href="https://www.esri.com" target="_blank">Esri</a> &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
        }),
        [dict("Grayscale")]: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Powered by <a href="https://www.esri.com" target="_blank">Esri</a> &mdash; Esri, DeLorme, NAVTEQ',
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
    minZoom: 6,
    maxZoom: 13,
    model: "TIR",                   // default model to start on
    parameter: "wstar",     // which paramter to start on
    startHour: '1300',
    opacityLevel: 0.7,
    opacityDelta: 0.1,
    loadingAnimationDelay: 300, // ms. Wait this long before showing a loading animation for the to-be-shown overlay
    zoomLocation: 'bottomleft',            // Zoom control position
    scaleLocation: 'bottomleft',           // Scale position
    layersLocation: 'topleft',             // Layer selector position
    RASPControlLocation: 'topleft',        // Position of custom RASP data control
    soundingMarker: 'img/sounding.svg',
    meteogramMarker: 'img/meteogram.svg',
    markerSize: 15
};

export { cModels , cColorscales , cCategories , cParameters , cMeteograms , cLayers , cDefaults };
