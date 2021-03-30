/*jshint esversion: 8 */

Game.MapGen = function(properties) {
    properties = properties || {};
    this._width = properties.width;
    this._height = properties.height;
    this._depth = properties.depth;
    this._minRoomWidth = properties.minRoomWidth;
    this._minRoomHeight = properties.minRoomHeight || this._minRoomWidth;
    this._maxRoomWidth = properties.maxRoomWidth;
    this._maxRoomHeight = properties.maxRoomHeight || this._maxRoomWidth;
    this._tiles = [];
    this._rooms = [];
    // initialize each level
    for (var z = 0; z < this._depth; z++) {
        this._rooms.push([]);
        this._tiles.push([]);
        for (var x = 0; x < this._width; x++) {
            this._tiles[z].push([]);
            for (var y = 0; y < this._height; y++) {
                this._tiles[z][x].push(Game.Tile.nullTile);
            }
        }
    }
    
    this.generateLevel(0);
};

Game.MapGen.prototype.getTiles = function () {
    return this._tiles;
};

Game.MapGen.prototype.getRooms = function () {
    return this._rooms;
};

Game.MapGen.prototype.getDepth = function () {
    return this._depth;
};
Game.MapGen.prototype.getWidth = function () {
    return this._width;
};
Game.MapGen.prototype.getHeight = function () {
    return this._height;
};

Game.MapGen.prototype.generateLevel = async function(z) {
    this.fillBorder(z);
    this.bsp(1, 1, this._width-2, this._height-2, z);
    
    this.addDoors(z, 20);
    Game.shuffle(this._rooms[z]);
    console.log("shuffled rooms");
    this.fillDeadEnds(z);
    this.makeCorridors(z);
    if (z > 0) {
        this.connectFloor(z);
    } 
    console.log("done generating level");
    return true;
};

// lays floor tiles within screen bounds,
// and fills the border with wall tiles
Game.MapGen.prototype.fillBorder = function(z) {
    var map = this._tiles[z];
    for (var i = 0; i < this._width; i++) {
        for (var j = 0; j < this._height; j++) {
            map[i][j] = Game.Tile.nullTile;
        }
    }
    for (var x = 0; x < this._width; x++) {
        for (var y = 0; y < this._height; y++) {
            if (x == 0 || y == 0 || x == this._width-1 || y == this._height-1) {
                map[x][y] = Game.Tile.wallTile;
            } else {
                map[x][y] = Game.Tile.floorTile;
            }
        }
    }
    return;
};

Game.MapGen.prototype.fillDeadEnds = function(z, maxFills) {
    var map = this._tiles[z];
    if (!this._rooms[z]) {
        return;
    }
    var maxCount = maxFills || 1000;
    var count = 0;
    var rooms = this._rooms[z];
    for (var i = 0; i < rooms.length; i++) {
        var room = rooms[i];
        var doors = this.getDoors(z, room);
        if (doors && doors.length == 1) {
            this.fillRoom(z, room, doors);
            rooms.splice(i, 1);
            i--;
            count++;
            if (count >= maxCount) {
                this._rooms[z] = rooms;
                return;
            }
        }
    }
    this._rooms[z] = rooms;
    return;
};

Game.MapGen.prototype.fillRoom = function(z, room, doors) {
    var map = this._tiles[z];
    var left = room.left+1;
    var top = room.top+1;
    var w = room.w-2;
    var h = room.h-2;

    // start by filling doors
    for (i = 0; i < doors.length; i++) {
        map[doors[i].x][doors[i].y] = Game.Tile.wallTile;
    }
    // then fill every cell within room with walls
    for (x = left; x < left + w; x++) {
        for (var y = top; y < top + h; y++) {
            map[x][y] = Game.Tile.wallTile;
        }
    }
};

Game.MapGen.prototype.makeCorridors = function(z, maxCorridors) {
    var map = this._tiles[z];
    
    var count = 0;
    var rooms = this._rooms[z];
    //Game.shuffle(rooms);
    maxCorridors = maxCorridors || Math.floor(rooms.length / 3);

    for (var i = 0; i < rooms.length; i++) {
        var room = rooms[i];
        var doors = this.getDoors(z, room);
        if (doors && doors.length >= 2) {
            this.makeCorridor(z, room, doors);
            rooms.splice(i, 1);
            i--;
            count++;
            if (count >= maxCorridors) {
                return;
            }
        }
    }
    this._rooms[z] = rooms;
    return;
};

Game.MapGen.prototype.makeCorridor = function(z, room, doors) {
    var map = this._tiles[z];
    var paths = [];
    var count = 0;
    for (let i = 0; i < doors.length - 1; i++) {
        let path = Game.findShortestPath(
            this._tiles, z, 
            doors[i].x, doors[i].y, 
            doors[i+1].x, doors[i+1].y, 
            true
        );
        if (!path) {
            return;
        } else {
            count++;
            paths.push(path);
        }
    }

    this.fillRoom(z, room, doors);

    for (let i = 0; i < doors.length - 1; i++) {
        map[doors[i].x][doors[i].y] = Game.Tile.floorTile;
        map[doors[i+1].x][doors[i+1].y] = Game.Tile.floorTile;
    }
    for (let i = 0; i < paths.length; i++) {
        let path = paths[i];
        for (let j = 1; j < path.length - 1; j++) {
            map[path[j].x][path[j].y] = Game.Tile.floorTile;
        }
    } 
        
};

Game.MapGen.prototype.getDoors = function(z, room) {
    var map = this._tiles[z];
    var left = room.left;
    var top = room.top;
    var w = room.w;
    var h = room.h;
    var doors = [];
    for (x = left; x < left + w; x++) {
        for (var y = top; y < top + h; y++) {
            if ((x == left || x == left + w - 1 || y == top || y == top + h - 1) && 
                    map[x][y].isWalkable()) {
                doors.push({x: x, y: y});
            }
        }
    }
    return doors;
};

// helper function to see if a wall tile has
// two floor tiles as opposite orthogonal neighbors,
// and returns these neighbors if true
Game.MapGen.prototype.getOrthoNeighbors = function(x, y, z) {
    var map = this._tiles[z];
    if (map[x-1][y] == Game.Tile.floorTile && map[x+1][y] == Game.Tile.floorTile) {
        return [{x: x-1, y: y}, {x: x+1, y: y}];
    } 
    else if (map[x][y-1] == Game.Tile.floorTile && map[x][y+1] == Game.Tile.floorTile) {
        return [{x: x, y: y-1}, {x: x, y: y+1}];
    }
    return null;
};

// turns walls into floor until no two 
// floor tiles are more than maxDist apart
Game.MapGen.prototype.addDoors = function (z, maxDist) {
    // get list of all wall tiles not on border
    var map = this._tiles[z];
    var candidates = [];
    var w = this._width;
    var h = this._height;
    if (!maxDist) maxDist = Math.floor(Math.min(w, h) / 2);
    for (var i = 1; i < w-1; i++) {
        for (var j = 1; j < h-1; j++) {
            // check first if tile is a wall
            if (map[i][j] == Game.Tile.wallTile) {
                // then check if it has two opposite floor tiles as neighbors
                var pair = this.getOrthoNeighbors(i, j, z);
                if (pair) {
                    candidates.push({x: i, y: j, pair: pair});
                }
            }
        }
    }
    // randomize list of candidates to avoid bias
    Game.shuffle(candidates);

    // for each candidate, turn into wall if distance
    // between neighbors is above threshold
    var count = 0;
    for (i = 0; i < candidates.length; i++) {
        var dist = Game.findDistance(this._tiles, z, candidates[i].pair[0].x, candidates[i].pair[0].y, 
                                      candidates[i].pair[1].x, candidates[i].pair[1].y);
        if (dist > maxDist) {
            count++;
            map[candidates[i].x][candidates[i].y] = Game.Tile.doorTile;
        }
    }
    return;
};

// creates rooms in map using a bsp tree
// dir = 0 if vertical, 1 if horizontal
Game.MapGen.prototype.bsp = function(left, top, w, h, z) {
    var map = this._tiles[z];
    var mid;
    var door;
    var vertical = w > h ? true : false;
    // 50% chance of ending recursion early if room is small enough
    if ((w < this._maxRoomWidth) && (h < this._maxRoomHeight) && ((Math.random() * 100) > 50)) {
        this._rooms[z].push({left: left-1, top: top-1, w: w+2, h: h+2});
        return;
    }

    // split room vertically if it's wider than it is tall
    if (vertical) {
        var minX = left + this._minRoomWidth;
        var maxX = left + w - this._minRoomWidth - 1;
        // end recursion if splitting the room would make children too small
        if (minX > maxX) {
            this._rooms[z].push({left: left-1, top: top-1, w: w+2, h: h+2});
            return;
        }
        mid = Math.floor(Math.random() * (maxX - minX) + minX);
        // add wall on midpoint of room, splitting into two
        for (i = top; i < top+h; i++) {
            map[mid][i] = Game.Tile.wallTile;
        }

        // add a door in newly created wall
        // needs to be within minRoomHeight of the edge 
        // so future walls don't cover the door
        door = Math.floor(Math.random() * this._minRoomHeight + top);
        map[mid][door] = Game.Tile.doorTile;

        // recursively split new rooms left and right of midpoint
        this.bsp(left, top, mid-left, h, z);
        this.bsp(mid+1, top, left+w-mid-1, h, z);
        return;
    }
    else {
        var minY = top + this._minRoomHeight;
        var maxY = top + h - this._minRoomHeight - 1;
        // end recursion if splitting the room would make children too small
        if (minY > maxY) {
            this._rooms[z].push({left: left-1, top: top-1, w: w+2, h: h+2});
            return;
        }
        mid = Math.floor(Math.random() * (maxY - minY) + minY);
        // add wall on midpoint of room, splitting into two
        for (i = left; i < left+w; i++) {
            map[i][mid] = Game.Tile.wallTile;
        }

        // add a door in newly created wall
        // needs to be within minRoomHeight of the edge 
        // so future walls don't cover the door
        door = Math.floor(Math.random() * this._minRoomWidth + left);
        map[door][mid] = Game.Tile.doorTile;

        // recursively split new rooms above and below midpoint
        this.bsp(left, top, w, mid-top, z);
        this.bsp(left, mid+1, w, top+h-mid-1, z);
        return;
    }
};

Game.MapGen.prototype.connectFloor = function(z) {
    var x, y;
    do {
        x = Math.floor(Math.random() * this._width);
        y = Math.floor(Math.random() * this._height);
    } while(! ((this._tiles[z-1][x][y] == Game.Tile.floorTile) && (this._tiles[z][x][y] == Game.Tile.floorTile)));
    this._tiles[z-1][x][y] = Game.Tile.stairsDownTile;
    this._tiles[z][x][y] = Game.Tile.stairsUpTile;
};