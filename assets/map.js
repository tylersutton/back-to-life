/*jshint esversion: 8 */

Game.Map = function(tiles, rooms) {
    this._tiles = tiles;
    this._rooms = rooms;
    // cache the width, height, and depth based
    // on the length of the dimensions of
    // the tiles array
    this._depth = tiles.length;
    this._width = tiles[0].length;
    this._height = tiles[0][0].length;
    this._fov = [];
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
    var fov = [];
    for (let x = 0; x < this._width; x++) {
        fov.push([]);
        for (let y = 0; y < this._height; y++) {
            var that = this;
            let isClearTile = function() {
                return that.getEntityAt(x, y, z) || 
                    (that.getTile(x, y, z) && 
                    that.getTile(x, y, z) != Game.Tile.nullTile && 
                    !that.getTile(x, y, z).isBlockingLight());
            };
            fov[x].push(isClearTile);
        }
    }
    this._fov.push(fov);
};

Game.Map.prototype.computeFov = function(centerX, centerY, z, radius, callback) {
    let x;
    let y;

    for(let i = 0; i < 720; i++) {
      x = Math.cos(i * 0.0087266);
      y = Math.sin(i * 0.0087266);
      this.doFov(centerX, centerY, x, y, z, radius, callback);
    }
  };
  
  Game.Map.prototype.doFov = function(centerX, centerY, x, y, z, radius, visibleCallback) {
  
    let ox;
    let oy;
    ox = centerX + 0.5;
    oy = centerY + 0.5;
    for(i = 0; i < radius; i++)
    {
      visibleCallback(Math.floor(ox), Math.floor(oy), ((radius - i) / radius));
      if(!this._fov[z][Math.floor(ox)][Math.floor(oy)]()) {
        return;
      }
      ox+=x;
      oy+=y;
    }
  };

// Gets the tile for a given coordinate set
Game.Map.prototype.getTile = function(x, y, z) {
    // Make sure we are inside the bounds. If we aren't, return
    // null tile.
    if (x < 0 || x >= this._width || y < 0 || y >= this._height || z < 0 || z >= this._depth || !this._tiles[z][x][y]) {
        return Game.Tile.nullTile;
    } else {
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

Game.Map.prototype.getRandomFloorInRoom = function(z, roomIndex) {
    var x, y;
    var left = this._rooms[z][roomIndex].left + 2;
    var top  = this._rooms[z][roomIndex].top + 2;
    var w    = this._rooms[z][roomIndex].w - 4;
    var h    = this._rooms[z][roomIndex].h - 4;
    do {
        x = Math.floor((Math.random() * w) + left);
        y = Math.floor((Math.random() * h) + top);
    } while(!this.isEmptyFloor(x, y, z));
    return {x: x, y: y, z: z};
};

Game.Map.prototype.getRoom = function(x, y, z) {
    var rooms = this._rooms[z];
    let left, top, w, h;
    for (let i = 0; i < rooms.length; i++) {
        left = rooms[i].left + 1;
        top  = rooms[i].top + 1;
        w    = rooms[i].w - 2;
        h    = rooms[i].h - 2;
        if (x >= left && x < left + w &&
                y >= top && y < top + h) {
            console.log("got room[" + i + "] => { left: " + left + ", top: " + top + ", w: " + w + ", h: " + h + "}");
            return i;
        }
    }
    return -1;
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

Game.Map.prototype.addEntityAtRandomPosition = function(entity, z, roomIndex) {
    var position;
    if (roomIndex !== undefined) {
        position = this.getRandomFloorInRoom(z, roomIndex);
    } else {
        position = this.getRandomFloorPosition(z);
    }
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
        if (!entity) {
        } else if (typeof(entity) === 'function') {
            // don't want this
        } else if (entity.getZ() !== z ||
                    entity.getX() < leftX ||
                    entity.getX() > rightX ||
                    entity.getY() < topY ||
                    entity.getY() > bottomY) {
            // don't want this either
        }
        else {
            results.push(entity);
        }
    }
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

Game.Map.prototype.addItemAtRandomPosition = function(item, z, roomIndex) {
    var position = this.getRandomFloorPosition(z, roomIndex);
    this.addItem(position.x, position.y, position.z, item);
};

// Finds shortest path between two cells in 2d map
// using breadth-first search
Game.Map.prototype.findShortestPath = function(z, x1, y1, x2, y2, orthogonalOnly, requireExplored) {
    var ortho = orthogonalOnly || false;
    var visited = [];
    var dist = [];
    var pred = [];

    var i, j;
    for (i = 0; i < this._width; i++) {
        visited.push([]);
        dist.push([]);
        pred.push([]);
        for (j = 0; j < this._height; j++) {
            visited[i][j] = false;
            dist[i][j] = 1000000;
            pred[i][j] = {x: -1, y: -1};
        }
    }
    var q = new Queue();
    q.enqueue({x: x1, y: y1});
    visited[x1][y1] = true;
    dist[x1][y1] = 0;

    while (!q.isEmpty()) {
        q.sort(dist);
        var v = q.dequeue();
        for (i = v.x - 1; i <= v.x + 1; i++) {
            for (j = v.y - 1; j <= v.y + 1; j++) {
                if (((!ortho && !(i == v.x && j == v.y)) || 
                        // confusing way to do xor
                        (ortho && (i == v.x ? j != v.y : j == v.y))) && 
                        i >= 0 && i < this._width && j >= 0 && j < this._height) {
                    if (!visited[i][j] && 
                        this.getTile(i, j, z).isWalkable() &&
                            (!requireExplored || this.isExplored(i, j, z))) {
                        visited[i][j] = true;
                        if ((i != v.x) && (j != v.y)) {
                            dist[i][j] = dist[v.x][v.y] + 1000000;
                        }
                        else {
                            dist[i][j] = dist[v.x][v.y] + 1;
                        }
                        pred[i][j] = {x: v.x, y: v.y};
                        q.enqueue({x: i, y: j});

                        if (i == x2 && j == y2) {
                            // backtrack from dest to source and record path
                            path = [];
                            crawl = {x: i, y: j};
                            path.push(crawl);
                            while(!(crawl.x == x1 && crawl.y == y1)) {
                                path.push(pred[crawl.x][crawl.y]);
                                crawl = pred[crawl.x][crawl.y];
                            }
                            path.reverse();
                            return path;
                        }
                    }
                }
            }
        }
    }
    return null;
};

// Finds shortest path between two cells in 2d map
// using breadth-first search
Game.Map.prototype.findClosestWalkableTile = function(z, x1, y1, requireExplored) {
    var visited = [];
    var dist = [];
    var pred = [];

    var i, j;
    for (i = 0; i < this._width; i++) {
        visited.push([]);
        dist.push([]);
        pred.push([]);
        for (j = 0; j < this._height; j++) {
            visited[i][j] = false;
            dist[i][j] = 1000000;
            pred[i][j] = {x: -1, y: -1};
        }
    }
    var q = new Queue();
    q.enqueue({x: x1, y: y1});
    visited[x1][y1] = true;
    dist[x1][y1] = 0;

    while (!q.isEmpty()) {
        q.sort(dist);
        var v = q.dequeue();
        for (i = v.x - 1; i <= v.x + 1; i++) {
            for (j = v.y - 1; j <= v.y + 1; j++) {
                if ((!(i == v.x && j == v.y)) && 
                        i >= 0 && i < this._width && j >= 0 && j < this._height) {
                    if (!visited[i][j]) {
                        visited[i][j] = true;
                        if ((i != v.x) && (j != v.y)) {
                            dist[i][j] = dist[v.x][v.y] + 1.41;
                        }
                        else {
                            dist[i][j] = dist[v.x][v.y] + 1;
                        }
                        pred[i][j] = {x: v.x, y: v.y};
                        q.enqueue({x: i, y: j});

                        if (this.getTile(i, j, z).isWalkable() && 
                                !this.getEntityAt(i, j, z) && 
                                (!requireExplored || this.isExplored(i, j, z))) {
                            // backtrack from dest to source and record path
                            return {x: i, y: j};
                        }
                    }
                }
            }
        }
    }

    return null;
};