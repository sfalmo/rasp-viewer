function isLandscape() {
    if (window.matchMedia('(orientation: portrait)').matches) {
        return false;
    }
    return true;
}

export { isLandscape };
