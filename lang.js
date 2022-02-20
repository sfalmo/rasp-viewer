if (localStorage.getItem("lang") == "en") {
    document.write("<script src='lang/en.js'></script>");
} else {
    document.write("<script src='lang/de.js'></script>");
}

function translate() {
    document.documentElement.lang = lang;
    document.title = dict["forecastTitle"];
}
