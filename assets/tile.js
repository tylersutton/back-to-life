const groundTileBackground = 'rgb(25,25,25)';

Game.Tile = function(properties) {
    properties = properties || {};
    // Call the Glyph constructor with our properties
    Game.Glyph.call(this, properties);
    // Set up the properties. We use false by default.
    this._walkable = properties.walkable || false;
    this._blocksLight = (properties.blocksLight !== undefined) ?
        properties.blocksLight : true;
    this._description = properties.description || '';
};
// Make tiles inherit all the functionality from glyphs
Game.Tile.extend(Game.Glyph);

Game.Tile.prototype.getDescription = function() {
    return this._description;
};

// Standard getters
Game.Tile.prototype.isWalkable = function() {
    return this._walkable;
};

Game.Tile.prototype.isSpawnable = function() {
    return this.isWalkable() && !this.isDoor();
};

Game.Tile.prototype.isBlockingLight = function() {
    return this._blocksLight;
};

Game.Tile.prototype.isDoor = function() {
    return this == Game.Tile.doorTile;
};

Game.Tile.prototype.isStairs = function() {
    return (this.isStairsUp() || this.isStairsDown());
};

Game.Tile.prototype.isStairsUp = function() {
    return this == Game.Tile.stairsUpTile;
};

Game.Tile.prototype.isStairsDown = function() {
    return this == Game.Tile.stairsDownTile;
};

Game.Tile.prototype.isHoleToCavern = function() {
    return this == Game.Tile.holeToCavernTile;
};

Game.Tile.nullTile = new Game.Tile({});

Game.Tile.floorTile = new Game.Tile({
    character: '·',
    walkable: true,
    foreground: 'rgb(120,120,120)',
    background: groundTileBackground,
    blocksLight: false,
    description: 'a stone floor'
});
Game.Tile.wallTile = new Game.Tile({
    character: '#',
    foreground: 'rgb(30, 30, 30)',
    background: 'rgb(140, 68, 68)',
    description: 'a stone wall'
});
Game.Tile.doorTile = new Game.Tile({
    character: '+',
    walkable: true,
    foreground: 'rgb(191,137,75)',
    background: 'rgb(163, 87, 0)',
    blocksLight: true,
    description: 'a wooden door'
});
Game.Tile.stairsUpTile = new Game.Tile({
    character: '<',
    foreground: 'white',
    background: groundTileBackground,
    walkable: true,
    blocksLight: false,
    description: 'a stone staircase leading upwards'
});
Game.Tile.stairsDownTile = new Game.Tile({
    character: '>',
    foreground: 'white',
    background: groundTileBackground,
    walkable: true,
    blocksLight: false,
    description: 'a stone staircase leading downwards'
});

Game.Tile.holeToCavernTile = new Game.Tile({
    character: 'O',
    foreground: 'white',
    background: groundTileBackground,
    walkable: true,
    blocksLight: false,
    description: 'a great dark hole in the ground'
});
Game.Tile.waterTile = new Game.Tile({
    character: '~',
    foreground: 'blue',
    background: '(20,20,80)',
    walkable: false,
    blocksLight: false,
    description: 'murky blue water'
});