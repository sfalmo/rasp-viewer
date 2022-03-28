if (localStorage.getItem("lang") == "en") {
    document.write("<script src='lang/en.js'></script>");
} else {
    document.write("<script src='lang/de.js'></script>");
}

function dict(key) {
    return loadedDict[key] ? loadedDict[key] : key;
}
