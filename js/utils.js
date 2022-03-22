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

export { isLandscape, unflatten };
