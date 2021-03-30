/*jshint esversion: 8 */

Game.Map.Dungeon = function(tiles, rooms, player) {
    // Call the Map constructor
    Game.Map.call(this, tiles, rooms);
    // Add player to floor 0
    this.addEntityAtRandomPosition(player, 0, 0);
    // Add entities and items to floor
    this.populateDungeon(0, player);
    // Setup fov for floor 0
    this.setupFov(0);
};

Game.Map.Dungeon.extend(Game.Map);

Game.Map.Dungeon.prototype.populateDungeon = function(z, player) {
    let playerLevel = (player && player.getLevel()) ? player.getLevel() : 1;
    let playerX = player.getX();
    let playerY = player.getY();
    let playerRoomIndex = null;
    if (z == player.getZ()) {
        playerRoomIndex = this.getRoom(playerX, playerY, z);
        (async() => {
            //console.log("waiting for variable");
            while(!playerRoomIndex) // define the condition as you like
                await new Promise(resolve => setTimeout(resolve, 10));
        })();
    }
    // Add random entities (not in same room as player)
    for (let i = 0; i < this._rooms[z].length; i++) {
        if (playerRoomIndex !== -1 && playerRoomIndex !== i) {
            let numEntities = 0;
            let chance = Math.random() * 100;
            if (chance < 85) {
                numEntities++;
            }
            if (chance < 8) {
                numEntities++;
            } if (chance < 1) {
                numEntities++;
            }
            for (let n = 0; n < numEntities; n++) {
                var entity = Game.EntityRepository.createRandom(z);
                this.addEntityAtRandomPosition(entity, z, i);
                // Level up the entity based on the floor
                if (entity.hasMixin('ExperienceGainer')) {
                    // scale entity level based on z-value and player's current level
                    var levelUps = Math.round((z + ((playerLevel-1)*2)));
                    for (var level = 0; level < levelUps; level++) {
                        entity.giveExperience(entity.getNextLevelExperience() -
                            entity.getExperience());
                    }
                }
            }
        }
    }

    // Add random non-equippable items
    for (let i = 0; i < this._rooms[z].length; i++) {
        // Add random entity (not in same room as player)
        if (playerRoomIndex !== -1 && playerRoomIndex !== i) {
            let numItems = 0;
            let chance = Math.random() * 100;
            if (chance < 50) {
                numItems++;
            }
            if (chance < 5) {
                numItems++;
            } if (chance < 1) {
                numItems++;
            }
            for (let n = 0; n < numItems; n++) {
                let item = Game.ItemRepository.createRandom(z, null, [Game.ItemMixins.Equippable]);
                this.addItemAtRandomPosition(item, z, i);
            }
        }
    }

    // add random wieldable
    var wieldable = Game.ItemRepository.createRandom(
        z, 
        [Game.ItemMixins.Equippable],
        null,
        'wieldable'
    );
    this.addItemAtRandomPosition(wieldable, z);
    
    // add random wearable
    var wearable = Game.ItemRepository.createRandom(
        z, 
        [Game.ItemMixins.Equippable],
        null,
        'wearable'
    );
    this.addItemAtRandomPosition(wearable, z);
    
    // Add a hole to the final cavern on the last level.
   if (z == this._depth - 1 && this._tiles[z] != Game.Tile.nullTile) {
    var holePosition = this.getRandomFloorPosition(this._depth - 1);
    this._tiles[this._depth - 1][holePosition.x][holePosition.y] = 
        Game.Tile.holeToCavernTile;
   }
};