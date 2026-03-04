function isLandscape() {
    if (window.matchMedia('(orientation: portrait)').matches) {
        return false;
    }
    return true;
}

function unflatten(valuesInOneDimension, size) {
    const {height, width} = size;
    const valuesInTwoDimensions = [];
    for (let y = 0; y < height; y++) {
        const start = y * width;
        const end = start + width;
        valuesInTwoDimensions.push(valuesInOneDimension.slice(start, end));
    }
    return valuesInTwoDimensions;
}

function press2height(hPa, unit="ft") {
    var result = (1 - Math.pow(hPa / 1013.25, 0.190284)) * 145366.45;
    if (unit == "m") {
        return result * 0.3048;
    }
    return result;
}

function press2FL(hPa) {
    const feet = press2height(hPa, "ft");
    const fl = Math.round(feet / 100);
    let flString = fl.toString();
    while (flString.length < 3) {
        flString = "0" + flString;
    }
    return flString;
}

export { isLandscape, unflatten, press2height, press2FL };
