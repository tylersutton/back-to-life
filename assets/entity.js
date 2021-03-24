Game.Entity = function(properties) {
    properties = properties || {};
    // Call the glyph's construtor with our set of properties
    Game.DynamicGlyph.call(this, properties);
    // Instantiate any properties from the passed object
    this._name = properties.name || '';
    this._x = properties.x || 0;
    this._y = properties.y || 0;
    this._z = properties.z || 0;
    this._speed = properties.speed || 1000;
    this._map = null;
    this._alive = true;
    

    // Create an object which will keep track what mixins we have
    // attached to this entity based on the name property
    this._attachedMixins = {};
    // Create a similar object for groups
    this._attachedMixinGroups = {};
    // Setup the object's mixins
    var mixins = properties.mixins || [];
    for (var i = 0; i < mixins.length; i++) {
        // Copy over all properties from each mixin as long
        // as it's not the name or the init property. We
        // also make sure not to override a property that
        // already exists on the entity.
        for (var key in mixins[i]) {
            if (key != 'init' && key != 'name' && !this.hasOwnProperty(key)) {
                this[key] = mixins[i][key];
            }
        }
        // Add the name of this mixin to our attached mixins
        this._attachedMixins[mixins[i].name] = true;
        // If a group name is present, add it
        if (mixins[i].groupName) {
            this._attachedMixinGroups[mixins[i].groupName] = true;
        }
        // Finally call the init function if there is one
        if (mixins[i].init) {
            mixins[i].init.call(this, properties);
        }
    }
};

// Make entities inherit all the functionality from dynamic glyphs
Game.Entity.extend(Game.DynamicGlyph);

// getters/setters
Game.Entity.prototype.getMap = function() { return this._map; };
Game.Entity.prototype.setMap = function(map) { this._map = map; };
Game.Entity.prototype.getSpeed = function() { return this._speed; };
Game.Entity.prototype.setSpeed = function(speed) { this._speed = speed; };
Game.Entity.prototype.getX = function() { return this._x; };
Game.Entity.prototype.getY = function() { return this._y; };
Game.Entity.prototype.getZ = function() { return this._z; };
Game.Entity.prototype.setX = function(x) { this._x = x; };
Game.Entity.prototype.setY = function(y) { this._y = y; };
Game.Entity.prototype.setZ = function(z) { this._z = z; };



Game.Entity.prototype.setPosition = function(x, y, z) {
    var oldX = this._x;
    var oldY = this._y;
    var oldZ = this._z;
    // Update position
    this._x = x;
    this._y = y;
    this._z = z;
    // If the entity is on a map, notify the map that the entity has moved.
    if (this._map) {
        this._map.updateEntityPosition(this, oldX, oldY, oldZ);
    }
};

Game.Entity.prototype.getPosition = function() {
    return {
        x: this._x, 
        y: this._y, 
        z: this._z
    };
};

Game.Entity.prototype.tryMove = function(x, y, z) {
    // Must use starting z
    var map = this.getMap();
    var tile = map.getTile(x, y, this.getZ());
    var target = map.getEntityAt(x, y, this.getZ());
    // If our z level changed, check if we are on stair
    if (!this.hasMixin('Mover') || this.isParalyzed()) {
        Game.sendMessage(this, "You can't move, you are paralyzed!");
        this.decrementParalysisTimer();
        return false;
    } else if (z < this.getZ()) {
        Game.sendMessage(this, "You ascend to level %d!", [z + 1]);
        this.setPosition(x, y, z);
    } else if (z > this.getZ()) {
        if (tile === Game.Tile.holeToCavernTile &&
                this.hasMixin(Game.EntityMixins.PlayerActor)) {
            // Switch the entity to a boss cavern!
            Game.sendMessage(this, "You descend into a cavern!");
            this.switchMap(new Game.Map.BossCavern());
        } else {
            this.setPosition(x, y, z);
            Game.sendMessage(this, "You descend to level %d!", [z + 1]);
        }
    // If an entity was present at the tile
    } else if (target) {
        // If we are an attacker, try to attack
        // the target
        if (this.hasMixin('Attacker') && 
            (this.hasMixin(Game.EntityMixins.PlayerActor) ||
             target.hasMixin(Game.EntityMixins.PlayerActor))) {
            if (this.hasMixin("Equipper") && this.getWeapon() && this.getWeapon().circleAttack) {

            }
                this.attack(target);
            return true;
        }
        return false;
    // Check if we can walk on the tile
    // and if so simply walk onto it
    } else if (tile.isWalkable()) {        
        // Update the entity's position
        this.setPosition(x, y, z);
        // Notify the entity that there are items at this position
        var items = this.getMap().getItemsAt(x, y, z);
        if (items) {
            if (items.length === 1) {
                if (this.hasMixin('PlayerActor')) {
                    var itemDescription = items[0].describeA();
                    if (this.pickupAllItems()) {
                        Game.sendMessage(this, "You pick up %s.", [itemDescription]);
                    } else {
                        Game.sendMessage(this, "You try to pick up %s but your inventory is full.", [itemDescription]);
                    }
                    
                }
                
            } else {
                if (this.hasMixin('PlayerActor')) {
                    if (this.pickupAllItems()) {
                        Game.sendMessage(this, "You pick up several objects.");
                    } else {
                        Game.sendMessage(this, "You try to pick up several objects but your inventory is full.");
                    }
                    
                }
            }
        }
        return true;
    } 
    return false;
};

Game.Entity.prototype.switchMap = function(newMap) {
    // If it's the same map, nothing to do!
    if (newMap === this.getMap()) {
        return;
    }
    this.getMap().removeEntity(this);
    // Clear the position
    this._x = 0;
    this._y = 0;
    this._z = 0;
    // Add to the new map
    newMap.addEntity(this);
};

Game.Entity.prototype.isAlive = function() {
    return this._alive;
};
Game.Entity.prototype.kill = function(message) {
    // Only kill once!
    if (!this._alive) {
        return;
    }
    this._alive = false;
    if (message) {
        Game.sendMessage(this, message);
    } else {
        Game.sendMessage(this, "YOU FAILED");
    }

    // Check if the player died, and if so call their act method to prompt the user.
    if (this.hasMixin(Game.EntityMixins.PlayerActor)) {
        this.act();
    } else {
        this.getMap().removeEntity(this);
    }
};