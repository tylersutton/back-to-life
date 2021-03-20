const VK_RETURN = 13;
const VK_ESCAPE = 27;
const VK_A = 65;
const VK_Z = 90;
const GOD_MODE = false;

Game.Screen = { };

// Define our initial start screen
Game.Screen.startScreen = {
    _isLoading: null,
    enter: function() {    
        this._isLoading = false;
        Game._display.setOptions({
            width: Game._menuScreenWidth,
            forceSquareRatio: false
        });
        console.log("Entered start screen."); 
    },
    exit: function() { console.log("Exited start screen."); },
    render: function(display) {
        // Render our prompt to the screen
        var title = "BACK TO LIFE!";
        var description1 = "Due to an unfortunate mix-up, ";
        var description2 = "you (@) have been ripped ";
        var description3 = "from the earth and sent to Hell. ";
        var description4 = "Fight your way to the depths of Hell,";
        var description5 = "defeat the Ruler,";
        var description6 = "and get your life back!";
        var prompt = "Press [Enter] to start!";
        var titleHeight = Math.floor(Game._screenHeight / 3)
        display.drawText(Math.floor((Game._menuScreenWidth / 2) - (title.length / 2)), 
                         titleHeight, 
                         "%c{orange}" + title
        );
        titleHeight += 2;
        titleHeight++
        display.drawText(Math.floor((Game._menuScreenWidth / 2) - (description1.length / 2)),
                        titleHeight++, 
                        "%c{darkgrey}" + description1);
        display.drawText(Math.floor((Game._menuScreenWidth / 2) - (description2.length / 2)),
                        titleHeight++, 
                        "%c{darkgrey}" + description2);
        display.drawText(Math.floor((Game._menuScreenWidth / 2) - (description3.length / 2)),
                        titleHeight++, 
                        "%c{darkgrey}" + description3);
        display.drawText(Math.floor((Game._menuScreenWidth / 2) - (description4.length / 2)),
                        titleHeight++, 
                        "%c{darkgrey}" + description4);
        display.drawText(Math.floor((Game._menuScreenWidth / 2) - (description5.length / 2)),
                        titleHeight++, 
                        "%c{darkgrey}" + description5);
        display.drawText(Math.floor((Game._menuScreenWidth / 2) - (description6.length / 2)),
                        titleHeight++, 
                        "%c{darkgrey}" + description6);
        titleHeight+= 2;
        display.drawText(Math.floor((Game._menuScreenWidth / 2) - (prompt.length / 2)),
                        titleHeight++, 
                        "%c{white}" + prompt);
    },
    handleInput: function(inputType, inputData) {
        // When [Enter] is pressed, go to the play screen
        if (inputType === 'keydown') {
            if (inputData.key === 'Enter') {
                this._isLoading = true;
                Game.switchScreen(Game.Screen.playScreen);
                Game.refresh();
                
            }
        }
    }
}

// Define our playing screen
Game.Screen.playScreen = {
    _player: null,
    _screenOffsetX: null,
    _screenOffsetY: null,
    _gameEnded: null,
    _waiting: null,
    _subScreen: null,
    _generator: null,
    _effects: null,
    enter: function() {  
        Game._display.setOptions({
            width: Game._screenWidth,
            forceSquareRatio: true
        });
    
        //var bodyRect = document.body.getBoundingClientRect();
        var elemRect = Game.getDisplay().getContainer().getBoundingClientRect();
        this._screenOffsetX = elemRect.left;
        this._screenOffsetY = elemRect.top;
        
        
        var genProps = {
            width: Game.getScreenWidth(),
            height: Game.getScreenHeight(),
            depth: 26,
            minRoomWidth: 3,
            maxRoomWidth: 6
        };
        // generate maze of rooms with MapGen
        this._generator = new Game.MapGen(genProps);
        var tiles = this._generator.getTiles();
        
        // Create our player and set the position
        this._player = new Game.Entity(Game.PlayerTemplate);
        // Create our map from the tiles
        var map = new Game.Map.Dungeon(tiles, this._player);
        
        this._effects = {};

        // reset gameEnded if game was restarted
        this._gameEnded = false;

        this._waiting = false;
        // Start the map's engine
        map.getEngine().start();
    },
    exit: function() { console.log("Exited play screen."); },
    render: function(display, uiDisplay) {
        // Render subscreen if there is one
        if (this._subScreen) {
            this._subScreen.render(display, uiDisplay);
            Game.Screen.uiScreen.render(this._player, uiDisplay, this._subScreen);
            return;
        }
        // Render map tiles
        this.renderTiles(display, this._subScreen);

        this.renderEffects(display);

        // Get the messages in the player's queue and render them
        Game.Screen.uiScreen.render(this._player, uiDisplay);
    },
    renderTiles: function(display) {
        var screenWidth = Game.getScreenWidth();
        var screenHeight = Game.getScreenHeight();

        // This object will keep track of all visible map cells
        var visibleCells = {};
        var map = this._player.getMap();
        var currentDepth = this._player.getZ();
        if (currentDepth < map._depth - 1 && map.getTile(1, 1, currentDepth+1) == Game.Tile.nullTile) {
            //console.log("adding extra floor");
            this._generator.generateLevel(currentDepth+1);
            this._player.getMap()._tiles.push(this._generator.getTiles()[currentDepth+1]);
            this._player.getMap().populateDungeon(currentDepth+1, this.player);
            this._player.getMap().setupFov(currentDepth+1);
        }
        // Find all visible cells and update the object
        map.getFov(this._player.getZ()).compute(
            this._player.getX(), this._player.getY(), 
            this._player.getSightRadius(), 
            function(x, y, radius, visibility) {
                visibleCells[x + "," + y] = true;
                map.setExplored(x, y, currentDepth, true);
            });
        
        // Render the explored map cells
        for (var x = 0; x < screenWidth; x++) {
            for (var y = 0; y < screenHeight; y++) {
                if (GOD_MODE || map.isExplored(x, y, currentDepth)) {
                    // Fetch the glyph for the tile and render it to the screen
                    // at the offset position.
                    var tile = map.getTile(x, y, currentDepth);
                    // The foreground color becomes dark gray if the tile has been
                    // explored but is not visible
                    var foreground = visibleCells[x + ',' + y] ? tile.getForeground() :
                            tile.isStairs() ? 'rgb(100,100,100)' : 'rgb(50,50,50)';
                    if (GOD_MODE || visibleCells[x + ',' + y]) {
                        var items = map.getItemsAt(x, y, currentDepth);
                        if (items) {
                            tile = items[items.length - 1];
                        }
                        if (map.getEntityAt(x, y, currentDepth)) {
                            tile = map.getEntityAt(x, y, currentDepth)
                        }
                        foreground = tile.getForeground();
                    }
                    display.draw(
                        x,
                        y,
                        tile.getChar(), 
                        foreground, 
                        tile.getBackground());
                }
            }
        }
    },
    renderEffects: function(display) {
        var screenWidth = Game.getScreenWidth();
        var screenHeight = Game.getScreenHeight();
        for (var x = 0; x < screenWidth; x++) {
            for (var y = 0; y < screenHeight; y++) {
                if (this._effects[x+','+y]) {
                    display.draw(x, y, this._effects[x+','+y]);
                }
            }
        }
    },
    addEffect: function(x, y, char) {
        this._effects[x+','+y] = char;
        Game.refresh();
    },
    removeEffect: function(x, y) {
        this._effects[x+","+y] = null;
        Game.refresh();
    },
    handleInput: function(inputType, inputData) {
        // If the game is over, enter will bring the user to the losing screen.
        var map = this._player.getMap();
        var shot = false;
        if (this._gameEnded) {
            if (inputType === 'keydown' && inputData.key === 'Enter') {
                Game.switchScreen(Game.Screen.startScreen);
            }
            // Return to make sure the user can't still play
            return;
        } 
        // Handle subscreen input if there is one
        if (this._subScreen) {
            this._subScreen.handleInput(inputType, inputData);
            return;
        } 
        // Handle playScreen input
        else if (inputType === 'keydown' && !this._waiting) {
            // Movement
            if ([37, 100].includes(inputData.keyCode)) { // left
                this.move(-1, 0, 0);
            } else if ([38, 104].includes(inputData.keyCode)) { // up
                this.move(0, -1, 0);
            } else if ([39, 102].includes(inputData.keyCode)) { // right
                this.move(1, 0, 0);
            } else if ([40, 98].includes(inputData.keyCode)) { // down
                this.move(0, 1, 0);
            } else if (inputData.keyCode === 103) { // up/left
                this.move(-1, -1, 0);
            } else if (inputData.keyCode === 105) { // up-right
                this.move(1, -1, 0);
            } else if (inputData.keyCode === 99) { // down-right
                this.move(1, 1, 0);
            } else if (inputData.keyCode === 97) { // down-left
                this.move(-1, 1, 0);
            } else if (inputData.key === 'z') { // wait
                this.move(0, 0, 0);   
            } else if (inputData.key === 'Enter') {
                if (map.getTile(this._player.getX(), this._player.getY(), this._player.getZ()).isStairsUp()) {
                    this.move(0, 0, -1);
                } else if (map.getTile(this._player.getX(), this._player.getY(), this._player.getZ()).isStairsDown()
                    || map.getTile(this._player.getX(), this._player.getY(), this._player.getZ()).isHoleToCavern()) {
                    this.move(0, 0, 1);
                }
            } else if (inputData.key === 'i') {
                if (this._player.getItems().filter(function(x){return x;}).length === 0) {
                    // If the player has no items, send a message and don't take a turn
                    Game.sendMessage(this._player, "You're not carrying anything.");
                    Game.refresh();
                } else {
                    // Show the inventory
                    Game.Screen.inventoryScreen.setup(this._player, this._player.getItems());
                    this.setSubScreen(Game.Screen.inventoryScreen);
                }
                return;
            } else if (inputData.key === 'h') {
                // Show the drop screen
                if (Game.Screen.healScreen.setup(this._player, this._player.getItems())) {
                    this.setSubScreen(Game.Screen.healScreen);
                } else {
                    Game.sendMessage(this._player, "You have nothing to heal with.");
                    Game.refresh();
                }
                return;
            } else if (inputData.key === 'l') {
                // Setup the look screen.
                Game.sendMessage(this._player, "Press [Esc] or [Enter] to cancel.");
                Game.Screen.lookScreen.setup(this._player,
                    this._player.getX(), this._player.getY());
                this.setSubScreen(Game.Screen.lookScreen);
                return;
            } else if (inputData.key === 'f') {
                // Setup the aim screen.
                Game.sendMessage(this._player, "Press [Enter] to fire or [Esc] to cancel.");
                Game.Screen.aimScreen.setup(this._player,
                    this._player.getX(), this._player.getY());
                this.setSubScreen(Game.Screen.aimScreen);
                return;
            } else if (inputData.key === 'p') {
                var items = map.getItemsAt(this._player.getX(), this._player.getY(), this._player.getZ());
                // If there are no items, show a message
                if (!items) {
                    Game.sendMessage(this._player, "There is nothing here to pick up.");
                    Game.refresh();
                } else if (items.length === 1) {
                    // If only one item, try to pick it up
                    var item = items[0];
                    if (this._player.pickupItems([0])) {
                        Game.sendMessage(this._player, "You pick up %s.", [item.describeA()]);
                        Game.refresh();
                    } else {
                        Game.sendMessage(this._player, "Your inventory is full! Nothing was picked up.");
                        Game.refresh();
                    }
                } else {
                    // Show the pickup screen if there are any items
                    Game.Screen.pickupScreen.setup(this._player, items);
                    this.setSubScreen(Game.Screen.pickupScreen);
                    return;
                }
            } else if (inputData.key === 's')  {
                if (this._player.getStatPoints() > 0) {
                    this._player.useStatPoints();
                }
            } else {
                return;
            }
        } else if (inputType === 'keypress') {
            var keyChar = String.fromCharCode(inputData.charCode);
            if (keyChar === '?') {
                // Setup the look screen.
                console.log("loading helpScreen");
                this.setSubScreen(Game.Screen.helpScreen);
                return;
            }
            //var keyChar = String.fromCharCode(inputData.charCode);
                // Not a valid key
        } else if (inputType === 'click') {
            
            var x = Math.floor((inputData.clientX - this._screenOffsetX) / Game._fontSize);
            var y = Math.floor((inputData.clientY - this._screenOffsetY) / Game._fontSize);
            
            var path = Game.findShortestPath(map._tiles, this._player.getZ(), 
                                             this._player.getX(), this._player.getY(), x, y);

            const sleep = (milliseconds) => {
                return new Promise(resolve => setTimeout(resolve, milliseconds))
            }

            const moveLoop = async (path) => {
                for (var i = 1; i < path.length; i++) {
                    await sleep(50);
                    if (this._gameEnded) {
                        return;
                    }
                    var blocked = map.getEntityAt(path[i].x, path[i].y, this._player.getZ()) ? true: false;
                    this.moveTo(path[i].x, path[i].y, this._player.getZ());
                    if (blocked) {
                        return;
                    }
                }
            }
            if (path) {
                moveLoop(path);
            }
            else {
                Game.sendMessage(this._player, "You can't move there!");
            }
        }
    },

    setGameEnded: function(gameEnded) {
        this._gameEnded = gameEnded;
    },

    move: function(dX, dY, dZ) {
        var newX = this._player.getX() + dX;
        var newY = this._player.getY() + dY;
        var newZ = this._player.getZ() + dZ;
        if (dZ != 0) {
            //console.log("z is changing!!!");
        }
        // Try to move to the new cell
        this._player.tryMove(newX, newY, newZ, this._player.getMap());
        // Unlock the engine
        this._player.getMap().getEngine().unlock();
        if (newX == this._player.getX() &&
                newY == this._player.getY() &&
                newZ == this._player.getZ()) {
            return true;
        }
        return false;
    },

    moveTo: function(newX, newY, newZ) {
        // Try to move to the new cell
        this._player.tryMove(newX, newY, newZ, this._player.getMap());
        // Unlock the engine
        this._player.getMap().getEngine().unlock();
    },
    setSubScreen: function(subScreen) {
        if (subScreen && subScreen != Game.Screen.lookScreen 
                      && subScreen != Game.Screen.aimScreen) {
            Game._display.setOptions({
                width: Game._menuScreenWidth,
                forceSquareRatio: false
            });
        }
        else {
            Game._display.setOptions({
                width: Game._screenWidth,
                forceSquareRatio: true
            });
        }
        this._subScreen = subScreen;
        // Refresh screen on changing the subscreen
        Game.refresh();
    },
    showItemsSubScreen: function(subScreen, items, emptyMessage) {
        if (items && subScreen.setup(this._player, items) > 0) {
            this.setSubScreen(subScreen);
        } else {
            Game.sendMessage(this._player, emptyMessage);
            Game.refresh();
        }
    }
};

Game.Screen.uiScreen = {
    render: function(player, display, subScreen) {
        var messages = player.getMessages();
        var messageY = 3;
        if (messages) {
            for (var i = 0; i < messages.length; i++) {
                // Draw each message, adding the number of lines
                messageY += display.drawText(
                    1, 
                    messageY,
                    messages[i]
                );
            }
        }
        var line = '%c{rgb(60,60,60)}';
        for (var i = 0; i < Game.getUIWidth(); i++){
            line += '=';
        }
        
        // Render player HP 
        var stats = '%c{}';
        var playerStats = '%c{}HP: ' + player.getHp() + '/' + player.getMaxHp() 
                + '   ATK: ' + player.getAttackValueWithoutDice() 
                + '+d' + player.getAttackDice() 
                + '   DEF: ' + player.getDefenseValue(); 
            display.drawText(1, 1, playerStats);
        if (subScreen) {
            //console.log("has subscreen");
            if (subScreen == Game.Screen.lookScreen) {
                //console.log("tryna print stats: " + stats);
                display.drawText(1, 0, '%c{}' + subScreen._caption);
            }
        }
        var levelBar = '=====>';
        var barLength = 6;
        var statPoints = '';
        if (player.getStatPoints() > 0) {
            statPoints = '[%c{rgb(50,255,50)}s%c{}]->stat pts: ' + player.getStatPoints();
        }
        var n = Math.round(player.getCurrentLevelProgress() * barLength - 1);
        var temp = levelBar.split('');
        temp.splice(0, barLength - n - 1);
        levelBar = temp.join('');
        for (var i = 0; i < barLength - n; i++) {
            levelBar += '.';
        }
        var currentFloor = player.getZ() + 1; 
        stats += 'FLOOR: ' + currentFloor + '   LVL: [%c{rgb(50,255,50)}' + player.getLevel() 
            + '%c{}' + levelBar + (player.getLevel()+1) + ']   XP: ' + player.getExperience() + '   ';
        //stats += vsprintf('FLOOR: %d   LVL: [%d' + levelBar + '%d]   XP: %d   ', 
         //   [player.getZ()+1,
        //     player.getLevel(), player.getLevel()+1, player.getExperience()]);
        stats += statPoints;
        
        
        display.drawText(1, 2, stats);
    }
};

Game.Screen.ItemListScreen = function(template) {
    // Set up based on the template
    this._caption = template['caption'];
    this._okFunction = template['ok'];
    this._selectOptionFunction = template['selectOption'];
    // Whether a 'no item' option should appear.
    this._hasNoItemOption = template['hasNoItemOption'];
    //
    this._hasOptionsMenu = template['hasOptionsMenu'];
    this._optionsOpen = false;
    // By default, we use the identity function
    this._isAcceptableFunction = template['isAcceptable'] || function(x) {
        return x;
    }
    // Whether the user can select items at all.
    this._canSelectItem = template['canSelect'];
    // Whether the user can select multiple items.
    this._canSelectMultipleItems = template['canSelectMultipleItems'];
};
Game.Screen.ItemListScreen.prototype.setup = function(player, items) {
    this._player = player;
    // Should be called before switching to the screen.
    var count = 0;
    // Iterate over each item, keeping only the aceptable ones and counting
    // the number of acceptable items.
    var that = this;
    this._items = items.map(function(item) {
        // Transform the item into null if it's not acceptable
        if (that._isAcceptableFunction(item)) {
            count++;
            return item;
        } else {
            return null;
        }
    });
    // Clean set of selected indices
    this._selectedIndices = {};
    this._selectedOption = null;
    return count;
};
Game.Screen.ItemListScreen.prototype.render = function(display) {
    var letters = 'abcdefghijklmnopqrstuvwxyz';
    // Render the caption in the top row
    display.drawText(Math.floor((Game._menuScreenWidth / 2) - (this._caption.length / 2)), 0, this._caption);
    // Render the no item row if enabled
    if (this._hasNoItemOption) {
        display.drawText(0, 1, '0 - no item');
    }
    var row = 0;
    
    for (var i = 0; i < this._items.length; i++) {
        // If we have an item, we want to render it.
        if (this._items[i]) {
            // Get the letter matching the item's index
            var letter = letters.substring(i, i + 1);
            // If we have selected an item, show a +, else show a dash between
            // the letter and the item's name.
            var selectionState = (this._canSelectItem && this._canSelectMultipleItems &&
                this._selectedIndices[i]) ? '+' : '-';
            // Check if the item is worn or wielded
            var suffix = '';
            if (this._items[i].hasMixin(Game.ItemMixins.Equippable)) {
                suffix += this._items[i].getSuffix();
            }
            if (this._items[i] === this._player.getArmor()) {
                suffix += ' (equipped)';
            } else if (this._items[i] === this._player.getWeapon()) {
                suffix += ' (equipped)';
            }
                // Render at the correct row and add 2.
            display.drawText(0, 2 + row, letter + ' ' + selectionState + ' ' 
                + this._items[i].getRepresentation() + ' ' + this._items[i].describe() + suffix);
            row++;
        }
        
        if (this._hasOptionsMenu && this._optionsOpen) {
            //console.log("tryna print options");
            var optionsDisplay = [
                '---------- Options ----------',
                '|  apply [a]     equip [e]  |',
                '|  examine [x]   drop [d]   |',
                '|  cancel [esc]             |',
                '-----------------------------'
            ];
            if (this._selectedIndices) {
                var key = Object.keys(this._selectedIndices)[0];
                var item = this._items[key];
                //.log(item.describe());
                if (item && item.hasMixin('Equippable') && (item == this._player.getWeapon() || item == this._player.getArmor())) {
                    optionsDisplay = [
                        '----------- Options -----------',
                        '|  apply [a]     unequip [e]  |',
                        '|  examine [x]   drop [d]     |',
                        '|  cancel [esc]               |',
                        '-------------------------------'
                    ];
                }
            }
            var optionsWidth = optionsDisplay[0].length;
            var optionsHeight = optionsDisplay.length;
            var optionsX = Math.floor((Game._menuScreenWidth / 2) - (optionsWidth / 2));
            var optionsY = Math.floor((Game._screenHeight / 2) - (optionsHeight / 2));
            //display.drawText(optionsX, optionsY++, topBar);
            display.drawText(optionsX, optionsY, optionsDisplay[0]);
            display.drawText(optionsX, optionsY+1, optionsDisplay[1]);
            display.drawText(optionsX, optionsY+2, optionsDisplay[2]);
            display.drawText(optionsX, optionsY+3, optionsDisplay[3]);
            display.drawText(optionsX, optionsY+4, optionsDisplay[4]);
            
        }
    }
};

Game.Screen.ItemListScreen.prototype.executeSelectOptionFunction = function() {
    var selectedItems = {};
    for (var key in this._selectedIndices) {
        selectedItems[key] = this._items[key];
    }

    this._selectOptionFunction(selectedItems, this._selectedOption);
    this._selectedOption = null;
}

Game.Screen.ItemListScreen.prototype.executeOkFunction = function() {
    // Gather the selected items.
    var selectedItems = {};
    for (var key in this._selectedIndices) {
        selectedItems[key] = this._items[key];
    }
    // Switch back to the play screen.
    Game.Screen.playScreen.setSubScreen(undefined);
    // Call the OK function and end the player's turn if it return true.
    if (this._okFunction(selectedItems)) {
        this._player.getMap().getEngine().unlock();
    }
};
Game.Screen.ItemListScreen.prototype.handleInput = function(inputType, inputData) {
    if (inputType === 'keydown') {
        // If the user hit escape, hit enter and can't select an item, or hit
        // enter without any items selected, simply cancel out
        if (inputData.keyCode === VK_ESCAPE || 
            (inputData.keyCode === VK_RETURN && 
                (!this._canSelectItem || Object.keys(this._selectedIndices).length === 0))) {
            if (this._hasOptionsMenu && this._optionsOpen) {
                this._optionsOpen = false;
                this._selectedIndices = {};
                Game.refresh();
            } else {
                Game.Screen.playScreen.setSubScreen(undefined);
            }    
        // Handle pressing return when items are selected
        } else if (inputData.keyCode === VK_RETURN) {
            if (this._hasOptionsMenu && this._optionsOpen) {
                this._optionsOpen = false;
                this._selectedIndices = {};
                Game.refresh();
            } else {
                this.executeOkFunction();
            }
        // Handle pressing zero when 'no item' selection is enabled
        } else if (this._canSelectItem && this._hasNoItemOption && inputData.key === '0') {
            this._selectedIndices = {};
            this.executeOkFunction();
        // Handle pressing a letter if we can select
        } else if (this._canSelectItem && inputData.keyCode >= VK_A &&
            inputData.keyCode <= VK_Z) {
                // Check if it maps to a valid item by subtracting 'a' from the character
            // to know what letter of the alphabet we used.
            var index = inputData.keyCode - VK_A;
            if (this._hasOptionsMenu && this._optionsOpen) {
                this._selectedOption = index;
                //console.log("before call: selectedOption = " + this._selectedOption);
                this.executeSelectOptionFunction();
            } else if (this._items[index]) {
                // If multiple selection is allowed, toggle the selection status, else
                // select the item and exit the screen
                if (this._canSelectMultipleItems) {
                    if (this._selectedIndices[index]) {
                        delete this._selectedIndices[index];
                    } else {
                        this._selectedIndices[index] = true;
                    }
                    // Redraw screen
                    Game.refresh();
                } else {
                    this._selectedIndices[index] = true;
                    if (this._hasOptionsMenu) {
                        this._optionsOpen = true;
                        Game.refresh();
                    } else {
                        this.executeOkFunction();
                    }
                }
            }
        }
    }
};

Game.Screen.healScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose an item to heal with',
    canSelect: true,
    canSelectMultipleItems: false,
    isAcceptable: function(item) {
        return item && item.hasMixin('Healing');
    },
    ok: function(selectedItems) {
        // Eat the item, removing it if there are no consumptions remaining.
        var key = Object.keys(selectedItems)[0];
        var item = selectedItems[key];
        Game.sendMessage(this._player, "You consume %s.", [item.describeThe()]);
        item.consume(this._player);
        Game.refresh();
        this._player.removeItem(key);
        return true;
    }
});

Game.Screen.inventoryScreen = new Game.Screen.ItemListScreen({
    caption: 'Inventory',
    canSelect: true,
    canSelectMultipleItems: false,
    hasNoItemOption: false,
    hasOptionsMenu: true,
    isAcceptable: function(item) {
        return true;
    },
    selectOption: function(selectedItems, selectedOption) {
        var letters = 'abcdefghijklmnopqrstuvwxyz';
        var option = letters[selectedOption];
        var key = Object.keys(selectedItems)[0];
        var item = selectedItems[key];
        // console.log("got to inventory selectOption function");
        if (option === 'a') {
            if (item && item.hasMixin('Healing')) {
                Game.sendMessage(this._player, "You consume %s.", [item.describeThe()]);
                item.consume(this._player);
                this._player.removeItem(key);
                this._items[key] = null;
                this._optionsOpen = false;
                this._selectedIndices = {};
                Game.refresh();
            } else {
                Game.sendMessage(this._player, "You can't apply %s.", [item.describeA()]);
                Game.refresh();
            }
        } else if (option === 'e') {
            if (item && item.hasMixin('Equippable')) {
                if (item == this._player.getWeapon()) {
                    this._player.unwield();
                    Game.sendMessage(this._player, "You are empty handed.");
                    this._optionsOpen = false;
                    this._selectedIndices = {};
                    Game.refresh();
                } else if (item == this._player.getArmor()) {
                    this._player.takeOff();
                    Game.sendMessage(this._player, "You are not wearing anything.");
                    this._optionsOpen = false;
                    this._selectedIndices = {};
                    Game.refresh();
                } else if (item.isWieldable()) {
                    this._player.unequip(item);
                    this._player.wield(item);
                    Game.sendMessage(this._player, "You are wielding %s.", [item.describeA()]);
                    this._optionsOpen = false;
                    this._selectedIndices = {};
                    Game.refresh();
                } else if (item.isWearable()) {
                    this._player.unequip(item);
                    this._player.wear(item);
                    Game.sendMessage(this._player, "You are wearing %s.", [item.describeA()]);
                    this._optionsOpen = false;
                    this._selectedIndices = {};
                    Game.refresh();
                }
            } else {
                Game.sendMessage(this._player, "You can't equip %s.", [item.describeA()]);
                Game.refresh();
            }
        } else if (option === 'x') {
            Game.sendMessage(this._player, "It's %s (%s).", 
            [
                item.describeA(false),
                item.getDetails()
            ]);
            //this._optionsOpen = false;
            //this._selectedIndices = {};
            Game.refresh();
        } else if (option === 'd') {
            //Game.sendMessage(this._player, "You drop %s.", [item.describeThe()]);
            this._player.dropItem(key);
            this._items[key] = null;
            this._optionsOpen = false;
            this._selectedIndices = {};
            Game.refresh();
        }
    },
    ok: function(selectedItems) {
        return true;
    }
});

Game.Screen.pickupScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the items you wish to pickup.',
    canSelect: true,
    canSelectMultipleItems: true,
    ok: function(selectedItems) {
        // Try to pick up all items, messaging the player if they couldn't all be
        // picked up.
        if (!this._player.pickupItems(Object.keys(selectedItems))) {
            Game.sendMessage(this._player, "Your inventory is full! Not all items were picked up.");
        }
        return true;
    }
});

Game.Screen.gainStatScreen = {
    setup: function(entity) {
        // Must be called before rendering.
        this._entity = entity;
        this._options = entity.getStatOptions();
    },
    render: function(display) {
        var letters = 'abcdefghijklmnopqrstuvwxyz';
        var caption = 'Choose a stat to increase:';
        display.drawText(Math.floor((Game._menuScreenWidth / 2) - (caption.length / 2)), 0, caption);

        // Iterate through each of our options
        for (var i = 0; i < this._options.length; i++) {
            display.drawText(0, 2 + i, 
                letters.substring(i, i + 1) + ' - ' + this._options[i][0]);
        }

        // Render remaining stat points
        display.drawText(0, 4 + this._options.length,
            "Remaining points: " + this._entity.getStatPoints());   
    },
    handleInput: function(inputType, inputData) {
        if (inputType === 'keydown') {
            // If a letter was pressed, check if it matches to a valid option.
            if (inputData.keyCode >= VK_A && inputData.keyCode <= VK_Z) {
                // Check if it maps to a valid item by subtracting 'a' from the character
                // to know what letter of the alphabet we used.
                var index = inputData.keyCode - VK_A;
                if (this._options[index]) {
                    // Call the stat increasing function
                    this._options[index][1].call(this._entity);
                    // Decrease stat points
                    this._entity.setStatPoints(this._entity.getStatPoints() - 1);
                    // If we have no stat points left, exit the screen, else refresh
                    if (this._entity.getStatPoints() == 0) {
                        Game.Screen.playScreen.setSubScreen(undefined);
                    } else {
                        Game.refresh();
                    }
                }
            }
        }
    }
};

// Define our help screen
Game.Screen.helpScreen = {
    render: function(display) {
        var text = 'Back to Life - Help';
        var border = '-------------------';
        var y = 0;
        display.drawText((Game._menuScreenWidth / 2) - (text.length / 2), y++, text);
        display.drawText((Game._menuScreenWidth / 2) - (text.length / 2), y++, border);
        //display.drawText(0, y++, "You've been wrongly sent to Hell. Find the Ruler of Hell and defeat him to come back to life!");
        y++;
        display.drawText(0, y++, 'Controls:');
        y++;
        display.drawText(0, y++, 'Arrow keys/numpad to move and attack');
        display.drawText(0, y++, '[Enter] to use stairs');
        display.drawText(0, y++, '[Enter] or [Esc] to exit menus');
        display.drawText(0, y++, '[h] to quick-heal with an item');
        display.drawText(0, y++, '[i] to open inventory');
        display.drawText(0, y++, '[p] to pick up items');
        display.drawText(0, y++, '[s] to use stat points');
        display.drawText(0, y++, '[z] to wait a turn');
        display.drawText(0, y++, '[l] to look around you');
        display.drawText(0, y++, '[?] to show this help screen');
        y ++;
        text = '--- press any key to continue ---';
        display.drawText(Game._menuScreenWidth / 2 - text.length / 2, y++, text);
    },
    handleInput: function(inputType, inputData) {
        if (inputType === 'keydown')
        Game.Screen.playScreen.setSubScreen(null);
    }
};


Game.Screen.TargetBasedScreen = function(template) {
    template = template || {};
    // By default, our ok return does nothing and does not consume a turn.
    this._isAcceptableFunction = template['okFunction'] || function(x, y) {
        return false;
    };
    // The defaut caption function simply returns an empty string.
    this._captionFunction = template['captionFunction'] || function(x, y) {
        return '';
    }
};

Game.Screen.TargetBasedScreen.prototype.setup = function(player, startX, startY) {
    this._player = player;
    // Store original position. Subtract the offset to make life easy so we don't
    // always have to remove it.
    this._startX = startX;
    this._startY = startY;
    // Store current cursor position
    this._cursorX = this._startX;
    this._cursorY = this._startY;
    this._caption = '';
    // Cache the FOV
    var visibleCells = {};
    this._player.getMap().getFov(this._player.getZ()).compute(
        this._player.getX(), this._player.getY(), 
        this._player.getSightRadius(), 
        function(x, y, radius, visibility) {
            visibleCells[x + "," + y] = true;
        });
    this._visibleCells = visibleCells;
};

Game.Screen.TargetBasedScreen.prototype.render = function(display) {
    Game.Screen.playScreen.renderTiles.call(Game.Screen.playScreen, display);
    
    // Draw a line from the start to the cursor.
    var points = Game.getLine(this._startX, this._startY, this._cursorX,
        this._cursorY);

    // Render stars along the line.
    for (var i = 0; i < points.length; i++) {
        if (i == 0) {
            display.drawText(points[i].x, points[i].y, '%b{rgba(255,165,0,0.3)}@');
        } else {
            var map = this._player.getMap();
            var tile = map.getTile(points[i].x, points[i].y, this._player.getZ());
            var items = map.getItemsAt(points[i].x, points[i].y, this._player.getZ());
            
            if (items) {
                tile = items[items.length - 1];
            }
            if (map.getEntityAt(points[i].x, points[i].y, this._player.getZ())) {
                tile = map.getEntityAt(points[i].x, points[i].y, this._player.getZ())
            }
            var foreground = tile.getForeground();
            display.drawText(points[i].x, points[i].y, '%c{' + foreground + '}%b{rgba(255,165,0,0.3)}' + tile.getChar());
        }
    }

    // Render the caption at the bottom.
    this._caption = this._captionFunction(this._cursorX, this._cursorY);
};

Game.Screen.TargetBasedScreen.prototype.handleInput = function(inputType, inputData) {
    // Move the cursor
    if (inputType === 'keydown') {
        if ([37, 100].includes(inputData.keyCode)) { // left
            this.moveCursor(-1, 0);
        } else if ([38, 104].includes(inputData.keyCode)) { // up
            this.moveCursor(0, -1);
        } else if ([39, 102].includes(inputData.keyCode)) { // right
            this.moveCursor(1, 0);
        } else if ([40, 98].includes(inputData.keyCode)) { // down
            this.moveCursor(0, 1);
        } else if (inputData.keyCode === 103) { // up/left
            this.moveCursor(-1, -1);
        } else if (inputData.keyCode === 105) { // up-right
            this.moveCursor(1, -1);
        } else if (inputData.keyCode === 99) { // down-right
            this.moveCursor(1, 1);
        } else if (inputData.keyCode === 97) { // down-left
            this.moveCursor(-1, 1);
        } else if (inputData.keyCode === VK_ESCAPE) {
            Game.Screen.playScreen.setSubScreen(undefined);
        } else if (inputData.keyCode === VK_RETURN) {
            this.executeOkFunction();
        }
    } else if (inputType === 'mousemove') {
        var x = Math.floor((inputData.clientX - Game.Screen.playScreen._screenOffsetX) / Game._fontSize);
        var y = Math.floor((inputData.clientY - Game.Screen.playScreen._screenOffsetY) / Game._fontSize);
        this.moveCursorTo(x, y);
    }
    Game.refresh();
};

Game.Screen.TargetBasedScreen.prototype.moveCursor = function(dx, dy) {
    
    // Make sure we stay within bounds.
    var newCursorX = Math.max(0, Math.min(this._cursorX + dx, Game.getScreenWidth()));
    // We have to save the last line for the caption.
    var newCursorY = Math.max(0, Math.min(this._cursorY + dy, Game.getScreenHeight() - 1));
    if (this._visibleCells[newCursorX + "," + newCursorY]) {
        this._cursorX = newCursorX;
        this._cursorY = newCursorY;
    }
};

Game.Screen.TargetBasedScreen.prototype.moveCursorTo = function(x, y) {
    
    // Make sure we stay within bounds.
    var newCursorX = Math.max(0, Math.min(x, Game.getScreenWidth()));
    // We have to save the last line for the caption.
    var newCursorY = Math.max(0, Math.min(y, Game.getScreenHeight() - 1));
    if (this._visibleCells[newCursorX + "," + newCursorY]) {
        this._cursorX = newCursorX;
        this._cursorY = newCursorY;
    }
};

Game.Screen.TargetBasedScreen.prototype.executeOkFunction = function() {
    // Switch back to the play screen.
    Game.Screen.playScreen.setSubScreen(undefined);
    // Call the OK function and end the player's turn if it return true.
    if (this._isAcceptableFunction(this._cursorX, this._cursorY)) {
        this._player.getMap().getEngine().unlock();
    }
};

Game.Screen.lookScreen = new Game.Screen.TargetBasedScreen({
    captionFunction: function(x, y) {
        var z = this._player.getZ();
        var map = this._player.getMap();
        // If the tile is explored, we can give a better capton
        if (map.isExplored(x, y, z)) {
            // If the tile isn't explored, we have to check if we can actually 
            // see it before testing if there's an entity or item.
            if (this._visibleCells[x + ',' + y]) {
                var items = map.getItemsAt(x, y, z);
                // If we have items, we want to render the top most item
                if (items) {
                    var item = items[items.length - 1];
                    return sprintf('You see %s (%s)',
                        item.describeA(false),
                        item.getDetails());
                // Else check if there's an entity
                } else if (map.getEntityAt(x, y, z)) {
                    var entity = map.getEntityAt(x, y, z);
                    //console.log("entity details: " + entity.getDetails())
                    return sprintf('You see %s (%s)',
                        entity.describeA(false),
                        entity.getDetails());
                }
            }
            // If there was no entity/item or the tile wasn't visible, then use
            // the tile information.
            return sprintf('You see %s',
                map.getTile(x, y, z).getDescription());

        } else {
            // If the tile is not explored, show the null tile description.
            return sprintf('You see %s',
                Game.Tile.nullTile.getDescription());
        }
    }
});

Game.Screen.aimScreen = new Game.Screen.TargetBasedScreen({
    captionFunction: function(x, y) {
        var z = this._player.getZ();
        var map = this._player.getMap();
        // If the tile is explored, we can give a better capton
        if (map.isExplored(x, y, z)) {
            // If the tile isn't explored, we have to check if we can actually 
            // see it before testing if there's an entity or item.
            if (this._visibleCells[x + ',' + y]) {
                var items = map.getItemsAt(x, y, z);
                // If we have items, we want to render the top most item
                if (items) {
                    var item = items[items.length - 1];
                    return sprintf('You aim at %s (%s)',
                        item.describeA(false),
                        item.getDetails());
                // Else check if there's an entity
                } else if (map.getEntityAt(x, y, z)) {
                    var entity = map.getEntityAt(x, y, z);
                    //console.log("entity details: " + entity.getDetails())
                    return sprintf('You aim at %s (%s)',
                        entity.describeA(false),
                        entity.getDetails());
                }
            }
            // If there was no entity/item or the tile wasn't visible, then use
            // the tile information.
            return sprintf('You aim at %s',
                map.getTile(x, y, z).getDescription());

        } else {
            // If the tile is not explored, show the null tile description.
            return sprintf('You aim at %s',
                Game.Tile.nullTile.getDescription());
        }
    },
    okFunction: function(x, y) {
        this._player.rangedAttack(x, y);
        return true;
    }
});

// Define our winning screen
Game.Screen.winScreen = {
    enter: function() {    console.log("Entered win screen."); },
    exit: function() { console.log("Exited win screen."); },
    render: function(display) {
        // Render our prompt to the screen
        for (var i = 0; i < 22; i++) {
            // Generate random background colors
            var r = Math.round(Math.random() * 255);
            var g = Math.round(Math.random() * 255);
            var b = Math.round(Math.random() * 255);
            var background = ROT.Color.toRGB([r, g, b]);
            display.drawText(2, i + 1, "%b{" + background + "}You win!");
        }
    },
    handleInput: function(inputType, inputData) {
        // Nothing to do here      
    }
}

// Define our winning screen
Game.Screen.loseScreen = {
    enter: function() {    console.log("Entered lose screen."); },
    exit: function() { console.log("Exited lose screen."); },
    render: function(display) {
        // Render our prompt to the screen
        for (var i = 0; i < 22; i++) {
            display.drawText(2, i + 1, "%b{red}You lose! :(");
        }
    },
    handleInput: function(inputType, inputData) {
        // Nothing to do here      
    }
}