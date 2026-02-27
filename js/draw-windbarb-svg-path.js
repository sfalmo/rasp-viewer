export default function drawWindbarbSvgPath(speed) {
    var speedRounded = Math.round(speed / 5) * 5;
    var flags = Math.floor(speedRounded / 50);
    var pennants = Math.floor((speedRounded - flags * 50) / 10);
    var halfpennants = Math.floor((speedRounded - flags * 50 - pennants * 10) / 5);
    var path = "M20 3 L20 20 ";
    var j = 1;
    for (let i = 0; i < flags; i++) {
        path += "M20 " + j + " L24 " + j + " L20 " + (j + 2) + " L20 " + j + " ";
        j += 4;
    }
    if (flags == 0) {
        j += 2;
    }
    for (let i = 0; i < pennants; i++) {
        path += "M20 " + j + " L24 " + (j - 2) + " ";
        j += 2;
    }
    if (halfpennants == 1) { // cannot be more than one halfpennant
        if (flags == 0 && pennants == 0) {
            j += 2;
        }
        path += "M20 " + j + " L22 " + (j - 1) + " ";
    }
    path += "Z";
    return path;
}
