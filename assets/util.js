
Game.extend = function(src, dest) {
    // Create a copy of the source.
    var result = {};
    for (var key in src) {
        result[key] = src[key];
    }
    // Copy over all keys from dest
    for (var key in dest) {
        result[key] = dest[key];
    }
    return result;
};

Game.getLine = function(startX, startY, endX, endY) {
    var points = [];
    var dx = Math.abs(endX - startX);
    var dy = Math.abs(endY - startY);
    var sx = (startX < endX) ? 1 : -1;
    var sy = (startY < endY) ? 1 : -1;
    var err = dx - dy;
    var e2;
    while (true) {
        points.push({x: startX, y: startY});
        if (startX == endX && startY == endY) {
            break;
        }
        e2 = err * 2;
        if (e2 > -dx) {
            err -= dy;
            startX += sx;
        }
        if (e2 < dx){
            err += dx;
            startY += sy;
        }
    }
    return points;
};


// Finds shortest path between two cells in 2d map
// using breadth-first search
Game.findShortestPath = function(map3d, z, x1, y1, x2, y2, orthogonalOnly) {
    var map = map3d[z];
    var ortho = orthogonalOnly || false;
    var visited = [];
    var dist = [];
    var pred = [];
    var width = map.length;
    var height = map[0].length;
    for (var i = 0; i < width; i++) {
        visited.push([]);
        dist.push([]);
        pred.push([]);
        for (var j = 0; j < height; j++) {
            visited[i][j] = false;
            dist[i][j] = 1000000;
            pred[i][j] = {x: -1, y: -1};
        }
    }
    var q = new Queue();
    q.enqueue({x: x1, y: y1});
    visited[x1][y1] = true;
    dist[x1][y1] = 0;

    var gameMap = Game.Screen.playScreen._map || null;

    while (!q.isEmpty()) {
        q.sort(dist);
        var v = q.dequeue();

        for (var i = v.x - 1; i <= v.x + 1; i++) {
            for (var j = v.y - 1; j <= v.y + 1; j++) {
                var hasEntity = false;
                if (gameMap && gameMap.getEntityAt(i, j, x)) {
                    hasEntity = true;
                }
                if (((!ortho && !(i == v.x && j == v.y)) 
                || (ortho && (i == v.x ? !(j == v.y) : j == v.y)))
                 && i >= 0 && i < width && j >= 0 && j < height) {
                    if (!visited[i][j] && map[i][j] && map[i][j]._walkable 
                        && !(hasEntity && !(i == x2 && j == y2))) {
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
                            //console.log(path);
                            return path;
                        }
                    }
                }
            }
        }
    }
    return null;
    
}

Game.findDistance = function(map, z, x1, x2, y1, y2) {
    var path = this.findShortestPath(map, z, x1, x2, y1, y2);
    if (path) {
        return path.length-1;
    }
    else {
        return -1;
    }
}

Game.getNeighborPositions = function(x, y) {
    var tiles = [];
    // Generate all possible offsets
    for (var dX = -1; dX < 2; dX ++) {
        for (var dY = -1; dY < 2; dY++) {
            // Make sure it isn't the same tile
            if (dX == 0 && dY == 0) {
                continue;
            }
            tiles.push({x: x + dX, y: y + dY});
        }
    }
    return tiles.randomize();
}

// shuffles an array pseudo-randomly
Game.shuffle = function(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function Queue() {
    this.elements = [];
}

Queue.prototype.getElements = function() {
    var elems = [];
    for (var i = 0; i < this.length; i++) {
        elems.push(this.elements[i]);
    }
}

Queue.prototype.setElements = function(elems) {
    this.elements = elems;
}

Queue.prototype.sort = function(dist) {
    this.elements.sort(function(a,b) {
        return dist[a.x][a.y] - dist[b.x][b.y];
    });
}

Queue.prototype.enqueue = function (e) {
    this.elements.push(e);
};

// remove an element from the front of the queue
Queue.prototype.dequeue = function () {
    return this.elements.shift();
};

// check if the queue is empty
Queue.prototype.isEmpty = function () {
    return this.elements.length == 0;
};

// get the element at the front of the queue
Queue.prototype.peek = function () {
    return !this.isEmpty() ? this.elements[0] : undefined;
};

Queue.prototype.length = function() {
    return this.elements.length;
};