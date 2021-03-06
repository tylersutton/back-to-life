Game.EntityMixins = {};

// Main player's actor mixin
Game.EntityMixins.PlayerActor = {
    name: 'PlayerActor',
    groupName: 'Actor',
    act: function() {
        if (this._acting) {
            return;
        }
        this._acting = true;
        // Detect if the game is over
        if (!this.isAlive()) {
            Game.Screen.playScreen.setGameEnded(true);
            // Send a last message to the player
            Game.sendMessage(this, 'Press [Enter] to start over!');
        }
        // Re-render the screen
        Game.refresh();
        // Lock the engine and wait asynchronously
        // for the player to press a key.
        
        this.getMap().getEngine().lock();
        window.addEventListener("keydown", this); /* wait for input */
        this._acting = false;
        this._forceManual = false;
    },
    listeners: {
        onDamage: function() {
            this._forceManual = true;
        }
    }
};

Game.EntityMixins.TaskActor = {
    name: 'TaskActor',
    groupName: 'Actor',
    init: function(template) {
        // Load tasks
        this._tasks = template.tasks || ['wander'];
    },
    act: function() {
        // Iterate through all our tasks
        if (this.getZ() != this.getMap().getPlayer().getZ()) {
            return;
        }
        for (var i = 0; i < this._tasks.length; i++) {
            if (this.canDoTask(this._tasks[i])) {
                // If we can perform the task, execute the function for it.
                this[this._tasks[i]]();
                return;
            }
        }
    },
    canDoTask: function(task) {
        if (this.getZ() !== this.getMap().getPlayer().getZ()) {
            return false;
        }
        if (task === 'huntItem') {
            if (this.hasMixin('Sight') && this.hasMixin('InventoryHolder') && this.canAddItem()) {
                var items = this.getMap().getItemsWithinRadius(this.getX(), this.getY(), this.getZ(), this.getSightRadius());
                if (items) {
                    for (var i = 0; i < items.length; i++) {
                        if (this.canSeeItem(items[i])) {
                            return true;
                        }
                    }
                }
            } 
            return false;
        } else if (task === 'hunt') {
            return this.hasMixin('Sight') && this.canSee(this.getMap().getPlayer());
        } else if (task === 'wander') {
            return true;
        } else {
            throw new Error('Tried to perform undefined task ' + task);
        }
    },
    huntItem: function() {
        var map = this.getMap();
        var items = this.getMap().getItemsWithinRadius(this.getX(), this.getY(), this.getZ(), this.getSightRadius());
            if (items) {
                var paths = [];
                var path;
                for (var i = 0; i < items.length; i++) {
                    var pos = this.getMap().getItemPosition(items[i]);
                    if (this.getX() == pos[0] && this.getY() == pos[1] && this.getZ() == pos[2]) {
                        this.pickupItems([0]);
                        return;
                    } else if (this.canSeeItem(items[i])) {
                        path = map.findShortestPath(this.getZ(), 
                        this.getX(), this.getY(), pos[0], pos[1]);
                        if (path) {
                            paths.push(path);
                        }   
                    }
                }
                if (paths) {
                    var length = 1000;
                    var shortestPath = paths[0];
                    for (i = 0; i < paths.length; i++) {
                        path = paths[i];
                        if (path && path.length < length) {
                            length = path.length;
                            shortestPath = path;
                        }
                    }
                    if (shortestPath) {
                        this.tryMove(shortestPath[1].x, shortestPath[1].y, this.getZ());
                    }
                }
            }
        return;
    },
    hunt: function() {
        var map = this.getMap();
        var player = map.getPlayer();
        
        var offsetX = Math.abs(player.getX() - this.getX());
        var offsetY = Math.abs(player.getY() - this.getY());
        if (offsetX <= 1 && offsetY <= 1) {
            if (this.hasMixin('Attacker') && (!this.hasMixin('Mover') || !this.isParalyzed())) {
                this.attack(player);
                return;
            }
        } if (this.hasMixin('Equipper') && 
                this.getWeapon() && this.getWeapon().isRanged()) {
            this.rangedAttack(player);
        }

        var path = map.findShortestPath(this.getZ(), 
                this.getX(), this.getY(), player.getX(), player.getY());
        if (path) {
                    this.tryMove(path[1].x, path[1].y, this.getZ());
        }
    },
    wander: function() {
        dx = Math.round(Math.random() * 2 - 1);
        dy = Math.round(Math.random() * 2 - 1);
        this.tryMove(this.getX() + dx, this.getY() + dy, this.getZ());
    }
};

Game.EntityMixins.RulerActor = Game.extend(Game.EntityMixins.TaskActor, {
    init: function(template) {
        // Call the task actor init with the right tasks.
        Game.EntityMixins.TaskActor.init.call(this, Game.extend(template, {
            'tasks' : ['growArm', 'spawnSlime', 'hunt', 'wander']
        }));
        // We only want to grow the arm once.
        this._hasGrownArm = false;
    },
    canDoTask: function(task) {
        // If we haven't already grown arm and HP <= 20, then we can grow.
        if (task === 'growArm') {
            return this.getHp() <= 20 && !this._hasGrownArm;
        // Spawn a slime only a 10% of turns.
        } else if (task === 'spawnSlime') {
            return Math.round(Math.random() * 100) <= 15;
        // Call parent canDoTask
        } else {
            return Game.EntityMixins.TaskActor.canDoTask.call(this, task);
        }
    },
    growArm: function() {
        this._hasGrownArm = true;
        this.increaseAttackValue(10);
        // Send a message saying The Ruler grew an arm.
        Game.sendMessage(this.getMap().getPlayer(),
            'The Ruler has grown an extra arm!');
    },
    spawnSlime: function() {
        // Generate a random position nearby.
        var xOffset = Math.floor(Math.random() * 3) - 1;
        var yOffset = Math.floor(Math.random() * 3) - 1;

        // Check if we can spawn an entity at that position.
        if (!this.getMap().isEmptyFloor(this.getX() + xOffset, this.getY() + yOffset,
            this.getZ())) {
            // If we cant, do nothing
            return;
        }
        // Create the entity
        var slime = Game.EntityRepository.create('Slime');
        slime.setX(this.getX() + xOffset);
        slime.setY(this.getY() + yOffset);
        slime.setZ(this.getZ());
        this.getMap().addEntity(slime);
    },
    listeners: {
        onDeath: function(attacker) {
            // Switch to win screen when killed!
            Game.switchScreen(Game.Screen.winScreen);
        }
    }
});

// This signifies our entity can attack basic destructible enities
Game.EntityMixins.Attacker = {
    name: 'Attacker',
    groupName: 'Attacker',
    init: function(template) {
        this._baseAttackValue = template.baseAttackValue || 1;
        this._attackDice = template.attackDice || 1;
    },
    getAttackDice: function() {
        return this._attackDice;
    },
    getAttackValue: function() {
        var modifier = 0;
        // If we can equip items, then have to take into 
        // consideration weapon and armor
        if (this.hasMixin('Equipper')) {
            if (this.getWeapon()) {
                modifier += this.getWeapon().getAttackValue();
            }
            if (this.getArmor()) {
                modifier += this.getArmor().getAttackValue();
            }
        }
        return this._baseAttackValue + Math.floor(Math.random() * this._attackDice) + 1 + modifier;
    },
    getAttackValueWithoutDice: function() {
        var modifier = 0;
        // If we can equip items, then have to take into 
        // consideration weapon and armor
        if (this.hasMixin('Equipper')) {
            if (this.getWeapon()) {
                modifier += this.getWeapon().getAttackValue();
            }
            if (this.getArmor()) {
                modifier += this.getArmor().getAttackValue();
            }
        }
        return this._baseAttackValue + modifier;
    },
    increaseAttackValue: function(value) {
        // If no value was passed, default to 2.
        value = value || 1;
        // Add to the attack value.
        this._baseAttackValue += value;
        Game.sendMessage(this, "You look stronger!");
    },
    attack: function(target, melee) {
        // If the target is destructible, calculate the damage
        // based on attack and defense value
        if (this != target && target.hasMixin('Destructible')) {
            var attack = this.getAttackValue();
            var defense = target.getDefenseValue();
            var damage;
            if (attack == 0) {
                damage = 0;
            } else if (melee && this.hasMixin('Equipper') && 
                    this.getWeapon() && this.getWeapon().isRanged()) {
                attack -= this.getWeapon().getAttackValue();
            }
            else {
                damage = Math.max(0, Math.round(attack * attack / (attack + defense)));
            }
            Game.sendMessage(this, 'You strike the %s for %d damage!', 
                [target.getName(), damage]);
            Game.sendMessage(target, 'The %s strikes you for %d damage!', 
                [this.getName(), damage]);
            target.takeDamage(this, damage);
        }
    },
    activateScroll: function(x, y, scroll) {
        if (scroll && scroll.hasMixin('Scroll')) {
            if (scroll.hasMixin('Paralysis')) {
                var line = Game.getLine(this.getX(), this.getY(), x, y, true);
                var path = [];
                var target = null;
                for (var i = 0; i < line.length; i++) {
                    path.push(line[i]);
                    // stop path if it hits a nonwalkable space
                    if (!this.getMap().getTile(path[i].x, path[i].y, this.getZ()).isWalkable()) {
                        break;
                    }
                    target = this.getMap().getEntityAt(path[i].x, path[i].y, this.getZ());
                    if (target && this != target) {
                        break;
                    }
                }
                Game.Screen.playScreen._waiting = true;
                this.getMap().getEngine().lock();
                var that = this;

                Game.audio.play("scroll");
                // perform animation, then effect of scroll on contact with target
                new Game.Arrow({path: path}).go().then(function() {
                    if (target && that != target) {
                        if (target.hasMixin('Mover') && target.isParalyzable()) {
                            target.paralyze(scroll.getParalysisDuration());
                            Game.sendMessage(that, '%s is paralyzed!', [target.describeThe(true)]);
                            Game.sendMessage(target, 'You are paralyzed!');
                        } else {
                            Game.sendMessage(that, "%s cannot be paralyzed.", [target.describeThe(true)]);
                        }
                    } else {
                        Game.sendMessage(that, "You didn't hit anything.");
                    }
                    that.getMap().getEngine().unlock();
                    Game.refresh();
                    Game.Screen.playScreen._waiting = false;
                });
                return true;
            }
        } else {
            return false;
        }
    },
    rangedAttack: function(x, y) {
        // don't let the player shoot themself
        if (x === this.getX() && y === this.getY()) {
            Game.sendMessage(this, "You can't shoot yourself!");
            return;
        }
        if (this.hasMixin('Equipper') && this.getWeapon() && this.getWeapon().isRanged()) {
            var line = Game.getLine(this.getX(), this.getY(), x, y, true);
            var path = [];
            var target = null;
            for (var i = 0; i < line.length; i++) {
                path.push(line[i]);
                // stop path if it hits a nonwalkable space
                if (!this.getMap().getTile(path[i].x, path[i].y, this.getZ()).isWalkable()) {
                    break;
                }
                target = this.getMap().getEntityAt(path[i].x, path[i].y, this.getZ());
                if (target && this != target) {
                    break;
                }
            }
            Game.Screen.playScreen._waiting = true;
            this.getMap().getEngine().lock();
            var that = this;
            Game.sendMessage(this, 'You fire %s.', [this.getWeapon().describeThe()]);
            Game.audio.play("arrow");
            // perform arrow animation, then attack target on contact
            new Game.Arrow({path: path}).go().then(function() {
                if (target && that != target) {
                    that.attack(target, false); // disable melee flag
                } else {
                    Game.sendMessage(that, "You didn't hit anything.");
                }
                //console.log("unlocking after ranged attack");
                that.getMap().getEngine().unlock();
                Game.refresh();
                Game.Screen.playScreen._waiting = false;
            });
        }
    },
    listeners: {
        details: function() {
            return [{key: 'atk', value: this.getAttackValueWithoutDice() + "+d" + this._attackDice}];
        }
    }
};

// This mixin signifies an entity can take damage and be destroyed
Game.EntityMixins.Destructible = {
    name: 'Destructible',
    init: function(template) {
        this._maxHp = template.maxHp || 10;
        // We allow taking in health from the template incase we want
        // the entity to start with a different amount of HP than the 
        // max specified.
        this._hp = template.hp || this._maxHp;
        this._defenseValue = template.defenseValue || 1;
        this._canHeal = (template.canHeal !== undefined) ?
            template.canHeal : true;
        this._healingFactor = template.healingFactor || 1;
    },
    getDefenseValue: function() {
        var modifier = 0;
        // If we can equip items, then have to take into 
        // consideration weapon and armor
        if (this.hasMixin('Equipper')) {
            if (this.getWeapon()) {
                modifier += this.getWeapon().getDefenseValue();
            }
            if (this.getArmor()) {
                modifier += this.getArmor().getDefenseValue();
            }
        }
        return this._defenseValue + modifier;
    },
    increaseDefenseValue: function(value) {
        // If no value was passed, default to 2.
        value = value || 1;
        // Add to the defense value.
        this._defenseValue += value;
        Game.sendMessage(this, "You look tougher!");
    },
    increaseMaxHp: function(value) {
        // If no value was passed, default to 10.
        value = value || 10;
        // Add to both max HP and HP.
        this._maxHp += value;
        this._hp += value;
        Game.sendMessage(this, "You look healthier!");
    },
    getHp: function() {
        return this._hp;
    },
    setHp: function(hp) {
        this._hp = Math.min(hp, this._maxHp);
        this.scaleForeground(this._hp / this._maxHp);
    },
    getMaxHp: function() {
        return this._maxHp;
    },
    takeDamage: function(attacker, damage) {
        this.setHp(this.getHp() - damage);
        this.raiseEvent('onDamage');
        // If have 0 or less HP, then remove ourselves from the map
        if (this._hp <= 0) {
            this._hp = 0;
            Game.sendMessage(attacker, 'You defeat the %s!', [this.getName()]);
            if (this.hasMixin('InventoryHolder') && !this.hasMixin('PlayerActor')) {
                this.dropItems();
            }
            this.raiseEvent('onDeath', attacker);
            attacker.raiseEvent('onKill', this);
            this.kill();
        }
        else {
            this.scaleForeground(this._hp / this._maxHp);
        }
    },
    heal: function(amount) {
        if (this._canHeal) {
            this.setHp(this._hp + amount);
        }
    },
    healWithItem: function() {
        if (this.canHeal() && this.hasMixin('InventoryHolder') && this._items) {
            for (var i = 0; i < this._items.length; i++) {
                var item = this._items[i];
                if (item && item.hasMixin('Healing') && item.canQuickHeal()) {
                    item.consume(this);
                    Game.sendMessage(this, "you consume %s.", [item.describeA()]);
                    this.removeItemByObject(item);
                    return true;
                }
            }
        }
        Game.sendMessage(this, "You have nothing to quick heal with.");
        return false;
    },
    canHeal: function() {
        return this._canHeal;
    },
    removeHealing: function() {
        this._canHeal = false;
    },
    regainHealing: function() {
        this._canHeal = true;
    },
    getHealingFactor: function() {
        return this._healingFactor;
    },
    setHealingFactor: function(factor) {
        this._healingFactor = factor;
    },
    listeners: {
        onGainLevel: function() {
            // Heal the entity.
            this.setHp(this.getMaxHp());
        },
        details: function() {
            return [
                {key: 'def', value: this.getDefenseValue()},
                {key: 'hp', value: this.getHp()}
            ];
        }
    }
};

Game.EntityMixins.Mover = {
    name: 'Mover',
    init: function(template) {
        this._canMove = (template.canMove !== undefined) ?
            template.canMove : true;
        this._paralyzable = (template.isParalyzable !== undefined) ?
            template.isParalyzable : true;
    },
    paralyze: function(duration) {
        if (this._paralyzable) {
            this._canMove = false;
            this._paralyzeTimer = duration;
        }
    },
    unparalyze: function() {
        this._canMove = true;
    },
    decrementParalysisTimer: function() {
        this._paralyzeTimer--;
        if (this._paralyzeTimer <= 0) {
            this.unparalyze();
        }
    },
    isParalyzable: function() {
        return this._paralyzable;
    },
    isParalyzed: function() {
        return !this._canMove;
    }
};

// This signifies our entity posseses a field of vision of a given radius.
Game.EntityMixins.Sight = {
    name: 'Sight',
    groupName: 'Sight',
    init: function(template) {
        this._sightRadius = template.sightRadius || 5;
    },
    getSightRadius: function() {
        return this._sightRadius;
    },
    increaseSightRadius: function(value) {
        // If no value was passed, default to 1.
        value = value || 1;
        // Add to sight radius.
        this._sightRadius += value;
        Game.sendMessage(this, "You are more aware of your surroundings!");
    },
    canSee: function(entity) {
        // If not on the same map or on different floors, then exit early
        if (
            !entity || this._map !== entity.getMap() || this._z !== entity.getZ()) {
            return false;
        }

        var otherX = entity.getX();
        var otherY = entity.getY();

        // If we're not in a square field of view, then we won't be in a real
        // field of view either.
        if ((otherX - this._x) * (otherX - this._x) +
            (otherY - this._y) * (otherY - this._y) >
            this._sightRadius * this._sightRadius) {
            return false;
        }

        // Compute the FOV and check if the coordinates are in there.
        var found = false;
        this.getMap().computeFov(
            this.getX(), 
            this.getY(),
            this.getZ(), 
            this.getSightRadius(), 
            function(x, y) {
                if (x === otherX && y === otherY) {
                    found = true;
                }
            });
        return found;
    },
    canSeePosition: function(otherX, otherY, z) {
        // If not on the same map or on different floors, then exit early
        if (z !== this.getZ()) {
            return false;
        }

        if (this.getX() == otherX && this.getY() == otherY && this.getZ() == z) {
            return true;
        }

        // If we're not in a square field of view, then we won't be in a real
        // field of view either.
        if ((otherX - this._x) * (otherX - this._x) +
            (otherY - this._y) * (otherY - this._y) >
            this._sightRadius * this._sightRadius) {
            return false;
        }

        // Compute the FOV and check if the coordinates are in there.
        var found = false;
        this.getMap().computeFov(
            this.getX(), this.getY(),
            this.getZ(),
            this.getSightRadius(), 
            function(x, y, radius, visibility) {
                if (x === otherX && y === otherY) {
                    found = true;
                }
            });
        return found;
    },
    canSeeItem: function(item) {
        if (!item || !this.getMap()) {
            return false;
        }

    
        // if we're standing on the item we can definitely see it
        if (this.getMap().getItemsAt(this.getX(), this.getY(), this.getZ())) {
            return true;
        }
        else {
            var minX = Math.max(0, this.getX() - this.getSightRadius());
            var maxX = Math.min(this.getMap().getWidth(), this.getX() + this.getSightRadius());
            var minY = Math.max(0, this.getY() - this.getSightRadius());
            var maxY = Math.min(this.getMap().getWidth(), this.getY() + this.getSightRadius());
            var map = this.getMap();
            for (var i = minX; i <= maxX; i++) {
                for (var j = minY; j <= maxY; j++) {
                    if (this.getMap().getItemsAt(i, j, this.getZ())) {
                        found = false;
                        map.computeFov(
                            this.getX(), 
                            this.getY(),
                            this.getZ(),
                            this.getSightRadius(), 
                            function(x, y) {
                                if (x === i && y === j) {
                                    found = true;
                                }
                            });
                        if (found) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
    }

};

Game.EntityMixins.Equipper = {
    name: 'Equipper',
    init: function(template) {
        this._weapon = null;
        this._armor = null;
    },
    wield: function(item) {
        this._weapon = item;
    },
    unwield: function() {
        this._weapon = null;
    },
    wear: function(item) {
        this._armor = item;
    },
    takeOff: function() {
        this._armor = null;
    },
    getWeapon: function() {
        return this._weapon;
    },
    getArmor: function() {
        return this._armor;
    },
    unequip: function(item) {
        // Helper function to be called before getting rid of an item.
        if (this._weapon === item) {
            this.unwield();
        }
        if (this._armor === item) {
            this.takeOff();
        }
    }
};

Game.EntityMixins.InventoryHolder = {
    name: 'InventoryHolder',
    init: function(template) {
        // Default to 10 inventory slots.
        var inventorySlots = template.inventorySlots || 10;
        // Set up an empty inventory.
        this._items = new Array(inventorySlots);
    },
    getItems: function() {
        return this._items;
    },
    getItem: function(i) {
        return this._items[i];
    },
    addItem: function(item) {
        // Try to find a slot, returning true only if we could add the item.
        for (var i = 0; i < this._items.length; i++) {
            if (!this._items[i]) {
                this._items[i] = item;
                return true;
            }
        }
        return false;
    },
    removeItem: function(i) {
        // If we can equip items, then make sure we unequip the item we are removing.
        if (this._items[i] && this.hasMixin(Game.EntityMixins.Equipper)) {
            this.unequip(this._items[i]);
        }
        // Simply clear the inventory slot.
        this._items[i] = null;
    },
    removeItemByObject: function(item) {
        for (var i = this._items.length - 1; i >= 0; i--) {
            if (this._items[i] == item) {
                this.removeItem(i);
                return;
            }
        }
    },
    canAddItem: function() {
        // Check if we have an empty slot.
        for (var i = 0; i < this._items.length; i++) {
            if (!this._items[i]) {
                return true;
            }
        }
        return false;
    },
    pickupItems: function(indices) {
        // Allows the user to pick up items from the map, where indices is
        // the indices for the array returned by map.getItemsAt
        var mapItems = this._map.getItemsAt(this.getX(), this.getY(), this.getZ());
        var added = 0;
        // Iterate through all indices.
        for (var i = 0; i < indices.length; i++) {
            // Try to add the item. If our inventory is not full, then splice the 
            // item out of the list of items. In order to fetch the right item, we
            // have to offset the number of items already added.
            if (this.addItem(mapItems[indices[i]  - added])) {
                mapItems.splice(indices[i] - added, 1);
                added++;
            } else {
                // Inventory is full
                break;
            }
        }
        // Update the map items
        this._map.setItemsAt(this.getX(), this.getY(), this.getZ(), mapItems);
        // Return true only if we added all items
        return added === indices.length;
    },
    pickupAllItems: function() {
        var mapItems = this._map.getItemsAt(this.getX(), this.getY(), this.getZ());
        var numItems = mapItems.length;
        var added = 0;
        //iterate through each item in array
        for (var i = 0; i < numItems; i++) {
            // Try to add the item. If our inventory is not full, then splice the 
            // item out of the list of items. In order to fetch the right item, we
            // have to offset the number of items already added.
            if (this.addItem(mapItems[i - added])) {
                mapItems.splice(i - added, 1);
                added++;
            } else {
                break;
            }
        }
        // Update the map items
        this._map.setItemsAt(this.getX(), this.getY(), this.getZ(), mapItems);
        // Return true only if we added all items
        return added === numItems;
    },
    dropItem: function(i) {
        // Drops an item to the current map tile
        if (this._items[i]) {
            if (this._map) {
                this._map.addItem(this.getX(), this.getY(), this.getZ(), this._items[i]);
            }
            Game.sendMessage(this, "You drop %s.", [this._items[i].describeThe()]);
            this.removeItem(i);      
        }
    },
    dropItemByObject: function(item) {
        for (var i = this._items.length-1; i >= 0; i--) {
            if (this._items[i] == item) {
                this.dropItem(i);
                return;
            }
        }
    },
    dropItems: function() {
        if (this._items) {
            for (var i = 0; i < this._items.length; i++) {
                this.dropItem(i);
            }
        }
    }
};

Game.EntityMixins.ExperienceGainer = {
    name: 'ExperienceGainer',
    init: function(template) {
        this._level = template.level || 1;
        this._experience = template.experience || 0;
        this._statPointsPerLevel = template.statPointsPerLevel || 1;
        this._statPoints = 0;
        // Determine what stats can be levelled up.
        this._statOptions = [];
        if (this.hasMixin('Attacker')) {
            this._statOptions.push(['Increase attack value by 1', this.increaseAttackValue]);
        }
        if (this.hasMixin('Destructible')) {
            this._statOptions.push(['Increase defense value by 1', this.increaseDefenseValue]);   
            this._statOptions.push(['Increase max health by 10', this.increaseMaxHp]);
        }
    },
    getLevel: function() {
        return this._level;
    },
    getExperience: function() {
        return this._experience;
    },
    getCurrentLevelExperience: function() {
        if (this._level == 1) {
            return 0;
        } else {
            return (Math.pow(this._level-1, 1.5)) * 50;
        }
    },
    getCurrentLevelProgress: function() {
        var progress = (this._experience - this.getCurrentLevelExperience()) / 
            (this.getNextLevelExperience() - this.getCurrentLevelExperience());
        return progress;
    },
    getNextLevelExperience: function() {
        return (Math.pow(this._level, 1.5)) * 50;
    },
    getStatPoints: function() {
        return this._statPoints;
    },
    setStatPoints: function(statPoints) {
        this._statPoints = statPoints;
    },
    useStatPoints: function() {
        this.raiseEvent('onUseStats');
    },
    getStatOptions: function() {
        return this._statOptions;
    },
    giveExperience: function(points) {
        var statPointsGained = 0;
        var levelsGained = 0;
        // Loop until we've allocated all points.
        while (points > 0) {
            // Check if adding in the points will surpass the level threshold.
            if (this._experience + points >= this.getNextLevelExperience()) {
                // Fill our experience till the next threshold.
                var usedPoints = this.getNextLevelExperience() - this._experience;
                points -= usedPoints;
                this._experience += usedPoints;
                // Level up our entity!
                this._level++;
                levelsGained++;
                this._statPoints += this._statPointsPerLevel;
                statPointsGained += this._statPointsPerLevel;
            } else {
                // Simple case - just give the experience.
                this._experience += points;
                points = 0;
            }
        }
        // Check if we gained at least one level.
        if (levelsGained > 0) {
            Game.sendMessage(this, "You advance to level %d. Type [s] to improve stats!", [this._level]);
            this.raiseEvent('onGainLevel');
        }
    },
    listeners: {
        onKill: function(victim) {
            var exp = victim.getMaxHp() + victim.getDefenseValue();
            if (victim.hasMixin('Attacker')) {
                exp += victim.getAttackValue();
            }
            exp = Math.round(exp/2);
            // Account for level differences
            if (victim.hasMixin('ExperienceGainer')) {
                exp -= (this.getLevel() - victim.getLevel()) * 10;
            }
            // Only give experience if more than 0.
            if (exp > 0) {
                this.giveExperience(Math.round(exp));
            }
        },
        //details: function() {
            //return [{key: 'lvl', value: this.getLevel()}];
        //}
    }
};

Game.EntityMixins.RandomStatGainer = {
    name: 'RandomStatGainer',
    groupName: 'StatGainer',
    listeners: {
        onGainLevel: function() {
            var statOptions = this.getStatOptions();
            // Randomly select a stat option and execute the callback for each
            // stat point.
            while (this.getStatPoints() > 0) {
                // Call the stat increasing function with this as the context.
                statOptions[Math.floor(Math.random() * statOptions.length)][1].call(this);
                this.setStatPoints(this.getStatPoints() - 1);
            }
        }
    }
};

Game.EntityMixins.PlayerStatGainer = {
    name: 'PlayerStatGainer',
    groupName: 'StatGainer',
    listeners: {
        onGainLevel: function() {
            Game.audio.play("levelup");
        },
        onUseStats: function() {
            // Setup the gain stat screen and show it.
            Game.Screen.gainStatScreen.setup(this);
            Game.Screen.playScreen.setSubScreen(Game.Screen.gainStatScreen);
        }

    }
};

Game.EntityMixins.MessageRecipient = {
    name: 'MessageRecipient',
    init: function(template) {
        this._messages = [];
        this._maxMessages = Game.getMessageHeight();
        this._colors = [];
        this._minColor = 100;
        this._maxColor = 255;
    },
    receiveMessage: function(message) {
        this._messages.push(message);
        while (this._messages.length > this._maxMessages) {
            this._messages.shift();
        }
        this._colors = [];
        var bottom = this._messages.length;
        for (var i = 0; i < bottom; i++) {
            if (this._messages[i] == "YOU FAILED") {
                this._colors.push("%c{rgb(200,0,0)}");
            }
            else { // formatting for fade-out of messages
                var val = Math.floor(this._minColor + ((i + this._maxMessages - bottom ) / (this._maxMessages - 1) * (this._maxColor - this._minColor)));
                var formatString = '%c{rgb(' + val + ',' + val + ',' + (Math.sqrt(val/this._maxColor) * val)   + ')}';
                this._colors.push(formatString);
            }
        }
    },
    getMessages: function() {
        var messages = [];
        if (this._messages) {
            for (var i = 0; i < this._messages.length; i++) {
                messages.push(this._colors[i] + this._messages[i]);
            }
        }
        return messages;
    }
};

// Message sending functions
Game.sendMessage = function(recipient, message, args) {
    // Make sure the recipient can receive the message 
    // before doing any work.
    if (recipient.hasMixin(Game.EntityMixins.MessageRecipient)) {
        // If args were passed, then we format the message, else
        // no formatting is necessary
        if (args) {
            message = vsprintf(message, args);
        }
        recipient.receiveMessage(message);
    }
};
Game.sendMessageNearby = function(map, centerX, centerY, centerZ, message, args) {
    // If args were passed, then we format the message, else
    // no formatting is necessary
    if (args) {
        message = vsprintf(message, args);
    }
    // Get the nearby entities
    entities = map.getEntitiesWithinRadius(centerX, centerY, centerZ, 5);
    // Iterate through nearby entities, sending the message if
    // they can receive it.
    for (var i = 0; i < entities.length; i++) {
        if (entities[i].hasMixin(Game.EntityMixins.MessageRecipient)) {
            entities[i].receiveMessage(message);
        }
    }
};