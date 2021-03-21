Game.Map.Dungeon = function(tiles, player) {
    // Call the Map constructor
    Game.Map.call(this, tiles);
    // Add the player
    this.addEntityAtRandomPosition(player, 0);
    // Add 10 random entities per floor
    this.populateDungeon(0);
};

Game.Map.Dungeon.extend(Game.Map);

Game.Map.Dungeon.prototype.populateDungeon = function(z, player) {
    var playerLevel = (player && player.getLevel()) ? player.getLevel() : 1;
    for (var i = 0; i < 10; i++) {
        // Add random entity
        var entity = Game.EntityRepository.createRandom(z);
        this.addEntityAtRandomPosition(entity, z);
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
    // add 3 to 5 health potions 
    var numHealing = Math.round((Math.random() * 2) + 3);
    for (var i = 0; i < numHealing; i++) {
        // add random item
        var item = Game.ItemRepository.createRandom(z, [Game.ItemMixins.Healing]);
        this.addItemAtRandomPosition(item, z);
    }
    // add 1 to 2 scrolls 
    var numScrolls = Math.round(Math.random() + 1);
    for (var i = 0; i < numScrolls; i++) {
        // add random item
        var item = Game.ItemRepository.createRandom(z, [Game.ItemMixins.Scroll]);
        this.addItemAtRandomPosition(item, z);
    }
    // 80% chance to add random wieldable
    if (Math.random() * 100 < 80) {
        var wieldable = Game.ItemRepository.createRandom(
            z, 
            [Game.ItemMixins.Equippable],
            [Game.ItemMixins.Scroll],
            'wieldable'
        );
        this.addItemAtRandomPosition(wieldable, z);
    }
    // 80% chance to add random wearable
    if (Math.random() * 100 < 80) {
        var wearable = Game.ItemRepository.createRandom(
            z, 
            [Game.ItemMixins.Equippable],
            [Game.ItemMixins.Scroll],
            'wearable'
        );
        this.addItemAtRandomPosition(wearable, z);
    }
    
    // Add a hole to the final cavern on the last level.
   if (z == this._depth - 1 && this._tiles[z] != Game.Tile.nullTile) {
    var holePosition = this.getRandomFloorPosition(this._depth - 1);
    this._tiles[this._depth - 1][holePosition.x][holePosition.y] = 
        Game.Tile.holeToCavernTile;
   }
}