Game.Glyph = function(properties) {
    // Instantiate properties to default if they weren't passed
    properties = properties || {};
    this._char = properties.character || ' ';
    this._foreground = properties.foreground || 'white';
    this._background = properties.background || 'rgb(20,20,20)';
    this._defaultForeground = this._foreground;
    this._defaultBackground = this._background;
};

// Create standard getters for glyphs
Game.Glyph.prototype.getChar = function(){ 
    if (this._char[0]) {
        return this._char[Math.floor(Math.random() * this._char.length)];
    } else {
        return this._char;
    }
};

Game.Glyph.prototype.getBackground = function(){
    return this._background;
};
Game.Glyph.prototype.getForeground = function(){ 
    return this._foreground; 
};
Game.Glyph.prototype.setBackground = function(newColor) {
    this._background = newColor;
};
Game.Glyph.prototype.setForeground = function(newColor) {
    this._foreground = newColor;
};
Game.Glyph.prototype.scaleForeground = function(scale) {
    var min = 70;
    var max = 255;
    var colors = ROT.Color.fromString(this._foreground);
    var defaultColors = ROT.Color.fromString(this._defaultForeground);
    for (var i = 0; i < 3; i++) {
        colors[i] = Math.floor((defaultColors[i] - min) * scale + min);
        ROT.Util.clamp(colors[i], min, max);
    }
    this._foreground = ROT.Color.toRGB(colors);
};
Game.Glyph.prototype.scaleBackground = function(scale) {
    var min = 70;
    var max = 255;
    var colors = ROT.Color.fromString(this._background);
    var defaultColors = ROT.Color.fromString(this._defaultBackground);
    for (var i = 0; i < 3; i++) {
        colors[i] = Math.floor((defaultColors[i] - min) * scale + min);
        ROT.Util.clamp(colors[i], min, max);
    }
    this._background = ROT.Color.toRGB(colors);
};

Game.Glyph.prototype.getRepresentation = function() {
    return '%c{' + this._foreground + '}%b{' + this._background + '}' + this._char +
        '%c{}%b{}';
};