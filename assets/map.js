Game.Map = function(tiles) {
    this._tiles = tiles;
    // cache the width, height, and depth based
    // on the length of the dimensions of
    // the tiles array
    this._depth = tiles.length;
    //console.log("map depth: " + this._depth);
    this._width = tiles[0].length;
    this._height = tiles[0][0].length;
    this._fov = [];
    this.setupFov(0);
    // create a table which will hold the entities
    this._entities = {};
    // Create a table which will hold the items
    this._items = {};
    // Create the engine and scheduler
    this._scheduler = new ROT.Scheduler.Speed();
    this._engine = new ROT.Engine(this._scheduler);

    // Setup the explored array
    this._explored = new Array(this._depth);
    this._setupExploredArray();
};

Game.Map.prototype.getWidth = function() {
    return this._width;
};
Game.Map.prototype.getHeight = function() {
    return this._height;
};
Game.Map.prototype.getDepth = function() {
    return this._depth;
};



Game.Map.prototype.setupFov = function(z) {
    // Keep this in 'map' variable so that we don't lose it.
    var map = this;
    this._fov.push(
        new ROT.FOV.DiscreteShadowcasting(function(x, y) {
            return map.getEntityAt(x, y, z) || (map.getTile(x, y, z) && map.getTile(x, y, z) != Game.Tile.nullTile && !map.getTile(x, y, z).isBlockingLight());
        }, {topology: 4}));
};


// Gets the tile for a given coordinate set
Game.Map.prototype.getTile = function(x, y, z) {
    // Make sure we are inside the bounds. If we aren't, return
    // null tile.
    if (x < 0 || x >= this._width || y < 0 || y >= this._height || z < 0 || z >= this._depth || !this._tiles[z][x][y]) {
        return Game.Tile.nullTile;
    } else {
        if (this._tiles[z][x][y] && typeof(this._tiles[z][x][y]) != "object") {
            //console.log("tile type: " + typeof(this._tiles[z][x][y]));
        }
        return this._tiles[z][x][y] || Game.Tile.nullTile;
    }
};

Game.Map.prototype.isEmptyFloor = function(x, y, z) {
    // Check if the tile is floor and also has no entity
    return this.getTile(x, y, z).isSpawnable() &&
           !this.getEntityAt(x, y, z);
};

Game.Map.prototype.getFov = function(depth) {
    return this._fov[depth];
};

Game.Map.prototype._setupExploredArray = function() {
    for (var z = 0; z < this._depth; z++) {
        this._explored[z] = new Array(this._width);
        for (var x = 0; x < this._width; x++) {
            this._explored[z][x] = new Array(this._height);
            for (var y = 0; y < this._height; y++) {
                this._explored[z][x][y] = false;
            }
        }
    }
};

Game.Map.prototype.setExplored = function(x, y, z, state) {
    // Only update if the tile is within bounds
    if (this.getTile(x, y, z) !== Game.Tile.nullTile) {
        this._explored[z][x][y] = state;
    }
};

Game.Map.prototype.isExplored = function(x, y, z) {
    // Only return the value if within bounds
    if (this.getTile(x, y, z) !== Game.Tile.nullTile) {
        return this._explored[z][x][y];
    } else {
        return false;
    }
};

Game.Map.prototype.getRandomFloorPosition = function(z) {
    // Randomly generate a tile which is a floor
    var x, y;
    do {
        x = Math.floor(Math.random() * this._width);
        y = Math.floor(Math.random() * this._height);
    } while(!this.isEmptyFloor(x, y, z));
    return {x: x, y: y, z: z};
};

Game.Map.prototype.getEngine = function() {
    return this._engine;
};
Game.Map.prototype.getEntities = function() {
    return this._entities;
};
Game.Map.prototype.getEntityAt = function(x, y, z){
    // Get the entity based on position key 
    return this._entities[x + ',' + y + ',' + z];
};

Game.Map.prototype.getPlayer = function() {
    return this._player;
};

//Game.Map.prototype.getPlayerEntity = function() {
    //return this._entities[0];
//}

Game.Map.prototype.addEntity = function(entity) {
    // Make sure the entity's position is within bounds
    if (entity.getX() < 0 || entity.getX() >= this._width ||
        entity.getY() < 0 || entity.getY() >= this._height ||
        entity.getZ() < 0 || entity.getZ() >= this._depth) {
        throw new Error('Adding entity out of bounds.');
    }
    // Update the entity's map
    entity.setMap(this);
    // Update the map with the entity's position
    this.updateEntityPosition(entity);
    // Check if this entity is an actor, and if so add
    // them to the scheduler
    if (entity.hasMixin('Actor')) {
        this._scheduler.add(entity, true);
    }
    // If the entity is the player, set the player.
    if (entity.hasMixin(Game.EntityMixins.PlayerActor)) {
        this._player = entity;
    }
};

Game.Map.prototype.addEntityAtRandomPosition = function(entity, z) {
    var position = this.getRandomFloorPosition(z);
    entity.setX(position.x);
    entity.setY(position.y);
    entity.setZ(position.z);
    this.addEntity(entity);
};

Game.Map.prototype.getEntitiesWithinRadius = function(centerX, centerY, z, radius) {
    results = [];
    // Determine our bounds
    var leftX = centerX - radius;
    var rightX = centerX + radius;
    var topY = centerY - radius;
    var bottomY = centerY + radius;
    var it = 0;
    // Iterate through our entities, adding any which are within the bounds
    for (var key in this._entities) {
        it++;
        var entity = this._entities[key];
        /*
        if (entity &&
            (!typeof(entity) === 'function') &&  
            entity.getX() >= leftX &&
            entity.getX() <= rightX && 
            entity.getY() >= topY &&
            entity.getY() <= bottomY &&
            entity.getZ() == z) 
        */
        if (!entity) {
            //console.log("entity is undefined");
        } else if (typeof(entity) === 'function') {
            //console.log("entity is a function");
        } else if (entity.getX() < leftX ||
                    entity.getX() > rightX ||
                    entity.getY() < topY ||
                    entity.getY() > bottomY ||
                    entity.getZ() !== z) {
            //console.log("entity is not within radius");
        }
        else {
            results.push(entity);
        }
    }
    //console.log("number of entities tested: " + it);
    //var count = results ? results.length : 0;
    //console.log("num of entities within radius: " + results.length);
    return results;
};

Game.Map.prototype.updateEntityPosition = function(entity, oldX, oldY, oldZ) {
    // Delete the old key if it is the same entity and we have old positions.
    if (typeof(oldX) !== "undefined") {
        var oldKey = oldX + ',' + oldY + ',' + oldZ;
        if (this._entities[oldKey] == entity) {
            delete this._entities[oldKey];
        }
    }
    // Make sure the entity's position is within bounds
    if (entity.getX() < 0 || entity.getX() >= this._width ||
        entity.getY() < 0 || entity.getY() >= this._height ||
        entity.getZ() < 0 || entity.getZ() >= this._depth) {
        throw new Error("Entity's position is out of bounds.");
    }
    // Sanity check to make sure there is no entity at the new position.
    var key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
    if (this._entities[key]) {
        throw new Error('Tried to add an entity at an occupied position.');
    }
    // Add the entity to the table of entities
    this._entities[key] = entity;
};

Game.Map.prototype.removeEntity = function(entity) {
    // Remove the entity from the map
    var key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
    if (this._entities[key] == entity) {
        delete this._entities[key];
    }
    // If the entity is an actor, remove them from the scheduler
    if (entity.hasMixin('Actor')) {
        this._scheduler.remove(entity);
    }
    // If the entity is the player, update the player field.
    if (entity.hasMixin(Game.EntityMixins.PlayerActor)) {
        this._player = undefined;
    }
};

Game.Map.prototype.getItemsAt = function(x, y, z) {
    return this._items[x + ',' + y + ',' + z];
};

Game.Map.prototype.getItemPosition = function(item) {
    if (this._items) {
        for (var key in this._items) {
            if (this._items[key].includes(item)) {
                //console.log("key: " + key);
                if (item.getName() != 'soul vial') {
                    //console.log("name: " + item.getName());
                }
                return key.split(',');
            }
        }
    }
};

Game.Map.prototype.getItemsWithinRadius = function(centerX, centerY, z, radius) {
    results = [];
    for (var x = centerX - radius; x <= centerX + radius; x++) {
        for (var y = centerY - radius; y <= centerY + radius; y++) {
            var items = this.getItemsAt(x, y, z);
            if (items) {
                for (var i = 0; i < items.length; i++) {
                    results.push(items[i]);
                }
            }
        }
    }
    return results;
};

Game.Map.prototype.setItemsAt = function(x, y, z, items) {
    // If our items array is empty, then delete the key from the table.
    var key = x + ',' + y + ',' + z;
    if (items.length === 0) {
        if (this._items[key]) {
            delete this._items[key];
        }
    } else {
        // Simply update the items at that key
        this._items[key] = items;
    }
};

Game.Map.prototype.addItem = function(x, y, z, item) {
    // If we already have items at that position, simply append the item to the 
    // list of items.
    var key = x + ',' + y + ',' + z;
    if (this._items[key]) {
        this._items[key].push(item);
    } else {
        this._items[key] = [item];
    }
};

Game.Map.prototype.addItemAtRandomPosition = function(item, z) {
    var position = this.getRandomFloorPosition(z);
    this.addItem(position.x, position.y, position.z, item);
};