/*jshint esversion: 8 */

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
        console.log("Entered start screen.");
        
        Game.resizeDisplay();
    },
    exit: function() { console.log("Exited start screen."); },
    render: function(display) {
        // Render our prompt to the screen
        var description1 = "______            _      _         ";
        var description2 = "| ___ \\          | |    | |        ";
        var description3 = "| |_/ / __ _  ___| | __ | |_ ___   ";
        var description4 = "| ___ \\/ _` |/ __| |/ / | __/ _ \\  ";
        var description5 = "| |_/ / (_| | (__|   <  | || (_) | ";
        var description6 = "\\____/ \\__,_|\\___|_|\\_\\ \\__\\____/  ";
        var description7 = "__     _  __     _ ";
        var description8 = "| |   (_)/ _|   | |";
        var description9 = "| |    _| |_ ___| |";
        var description10 = "| |   | |  _/ _ \\ |";
        var description11 = "| |___| | ||  __/_|";
        var description12 = "\\_____/_|_| \\___(_)";
        var descLength = 35;
        var descLength2 = 19;
        var prompt = "Press [Enter] to start!";
        var titleHeight = Game.getScreenHeight() / 2 - 10;
        display.drawText(Math.floor((Game._screenWidth / 2) - (descLength / 2)),
                        titleHeight++, 
                        "%c{orange}" + description1);
        display.drawText(Math.floor((Game._screenWidth / 2) - (descLength / 2)),
                        titleHeight++, 
                        "%c{orange}" + description2);
        display.drawText(Math.floor((Game._screenWidth / 2) - (descLength / 2)),
                        titleHeight++, 
                        "%c{orange}" + description3);
        display.drawText(Math.floor((Game._screenWidth / 2) - (descLength / 2)),
                        titleHeight++, 
                        "%c{orange}" + description4);
        display.drawText(Math.floor((Game._screenWidth / 2) - (descLength / 2)),
                        titleHeight++, 
                        "%c{orange}" + description5);
        display.drawText(Math.floor((Game._screenWidth / 2) - (descLength / 2)),
                        titleHeight++, 
                        "%c{orange}" + description6);
        titleHeight++;
        display.drawText(Math.floor((Game._screenWidth / 2) - (descLength2 / 2)),
                        titleHeight++, 
                        "%c{orange}" + description7);
        display.drawText(Math.floor((Game._screenWidth / 2) - (descLength2 / 2)),
                        titleHeight++, 
                        "%c{orange}" + description8);
        display.drawText(Math.floor((Game._screenWidth / 2) - (descLength2 / 2)),
                        titleHeight++, 
                        "%c{orange}" + description9);
        display.drawText(Math.floor((Game._screenWidth / 2) - (descLength2 / 2)),
                        titleHeight++, 
                        "%c{orange}" + description10);
        display.drawText(Math.floor((Game._screenWidth / 2) - (descLength2 / 2)),
                        titleHeight++, 
                        "%c{orange}" + description11);
        display.drawText(Math.floor((Game._screenWidth / 2) - (descLength2 / 2)),
                        titleHeight++, 
                        "%c{orange}" + description12);
        titleHeight += 2;
        var subtitle = "%c{darkorange}A Roguelike %c{gray}by Tyler Sutton";

        display.drawText(Math.floor((Game._screenWidth / 2) - ((subtitle.length - 22) / 2)),
                        titleHeight++, 
                        "" + subtitle);
        titleHeight += 2;
        display.drawText(Math.floor((Game._screenWidth / 2) - (prompt.length / 2)),
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
};

// Define our playing screen
Game.Screen.playScreen = {
    _player: null,
    _mapOffsetX: null,
    _mapOffsetY: null,
    _gameEnded: null,
    _waiting: null,
    _subScreen: null,
    _generator: null,
    _effects: null,
    _cursorX: null,
    _cursorY: null,
    _looking: null,
    _selectedButton: null,
    _visibleCells: null, // cached for looking purposes
    enter: function() {  
        //place map in correct location on display
        this._mapOffsetX = Game.getMapOffsetX();
        this._mapOffsetY = Game.getMapOffsetY();

        var genProps = {
            width: Game.getMapWidth(),
            height: Game.getMapHeight(),
            depth: 10,
            minRoomWidth: 4,
            maxRoomWidth: 8
        };
        // generate maze of rooms with MapGen
        this._generator = new Game.MapGen(genProps);
        var tiles = this._generator.getTiles();
        var rooms = this._generator.getRooms();
        // Create our player and set the position
        this._player = new Game.Entity(Game.PlayerTemplate);
        this._player.addItem(Game.ItemRepository.createRandom(0, [Game.ItemMixins.Equippable], null, 'ranged'));
        
        // Create our map from the tiles
        let that = this;
        var map = new Game.Map.Dungeon(tiles, rooms, this._player);
        
        // create random shadows for each tile in map
        this._shadows = [];
        for (let z = 0; z < map.getDepth(); z++) {
            this._shadows.push([]);
            for (let x = 0; x < map.getWidth(); x++) {
                this._shadows[z].push([]);
                for (let y = 0; y < map.getHeight(); y++) {
                    var scaleFactor = (Math.random() * 0.4) + 0.6;
                    this._shadows[z][x].push(scaleFactor);
                }
            }
        }

        this._effects = {};

        // reset gameEnded if game was restarted
        this._gameEnded = false;

        this._waiting = false;

        this._looking = false;
        this._visibleCells = {};
        // Start the map's engine
        map.getEngine().start();
    },
    exit: function() { console.log("Exited play screen."); },
    render: function(display) {
        // Render subscreen if there is one
        if (this._subScreen && this._subScreen == Game.Screen.helpScreen) {
            //this.renderMessages(display);
            this.renderInfoBar(display);
            this.renderOptionsBar(display);
            this._subScreen.render(display);
            return;
        }

        // Render map tiles
        this.renderTiles(display, this._subScreen);

        // Render player messages
        this.renderMessages(display);

        // Render player information on left side of screen
        this.renderInfoBar(display);

        // Render player options on bottom of screen
        this.renderOptionsBar(display);

        // Render active effects
        this.renderEffects(display);

        // Render look caption/path if currently looking
        if (this._looking) {
            this.renderLooking(display);
        }
        // Render subscreen if there is one
        if (this._subScreen) {
            this._subScreen.render(display);
        }
    },
    renderTiles: function(display) {
        var mapWidth = Game.getMapWidth();
        var mapHeight = Game.getMapHeight();

        // This object will keep track of all visible map cells
        var visibleCells = {};
        var lightLevel = {};
        var map = this._player.getMap();
        var currentDepth = this._player.getZ();
        if (currentDepth < map._depth - 1 && map.getTile(1, 1, currentDepth+1) == Game.Tile.nullTile) {
            this._generator.generateLevel(currentDepth+1);
            this._player.getMap()._tiles.push(this._generator.getTiles()[currentDepth+1]);
            this._player.getMap().populateDungeon(currentDepth+1, this._player);
            this._player.getMap().setupFov(currentDepth+1);
        }
        // Find all visible cells and update the object
        map.computeFov(
            this._player.getX(), 
            this._player.getY(),
            this._player.getZ(),
            this._player.getSightRadius(), 
            function(x, y, visibility) {
                visibleCells[x + "," + y] = true;
                map.setExplored(x, y, currentDepth, true);
                lightLevel[x + ',' + y] = visibility;
        });
        this._visibleCells = visibleCells;
        // Render the explored map cells
        for (var x = 0; x < mapWidth; x++) {
            for (var y = 0; y < mapHeight; y++) {
                if (GOD_MODE || map.isExplored(x, y, currentDepth)) {
                    // Fetch the glyph for the tile and render it to the screen
                    // at the offset position.
                    var tile = map.getTile(x, y, currentDepth);
                    // The foreground color becomes dark gray if the tile has been
                    // explored but is not visible
                    var foreground = visibleCells[x + ',' + y] ? tile.getForeground() :
                        Game.scaleRGB(tile.getForeground(), 0.3);
                    var background = visibleCells[x + ',' + y] ? tile.getBackground() :
                        Game.scaleRGB(tile.getBackground(), 0.3);
                    if (this._shadows[currentDepth][x][y] && lightLevel[x + ',' + y] && !tile.isDoor()) {
                        var scaleFactor = 0.3 + (lightLevel[x + ',' + y] * this._shadows[currentDepth][x][y] * 0.7);
                        background = Game.scaleRGB(background, scaleFactor);
                        foreground = Game.scaleRGB(foreground, scaleFactor);
                    }
                    var items = map.getItemsAt(x, y, currentDepth);
                    if (items) {
                        tile = items[items.length - 1];
                        foreground = tile.getForeground();
                    }
                    if (GOD_MODE || visibleCells[x + ',' + y]) {
                        if (map.getEntityAt(x, y, currentDepth)) {
                            tile = map.getEntityAt(x, y, currentDepth);
                            foreground = tile.getForeground();
                        }
                    }
                    if (this._gameEnded) {
                        foreground = Game.rgbToGrayscale(foreground);
                        background = Game.rgbToGrayscale(background);
                    }
                    display.draw(
                        x + this._mapOffsetX,
                        y + this._mapOffsetY,
                        tile.getChar(), 
                        foreground, 
                        background
                    );
                }
            }
        }
    },
    renderEffects: function(display) {
        var map = this._player.getMap();
        var mapWidth = Game.getMapWidth();
        var mapHeight = Game.getMapHeight();
        for (var x = 0; x < mapWidth; x++) {
            for (var y = 0; y < mapHeight; y++) {
                if (this._effects[x+','+y]) {
                    var tile = map.getTile(x, y, this._player.getZ());
                    var background = Game.scaleRGB(
                        tile.getBackground(), 
                        this._shadows[this._player.getZ()][x][y]
                    );
                    display.draw(
                        x + this._mapOffsetX, 
                        y + this._mapOffsetY, 
                        this._effects[x+','+y], 
                        'white', 
                        background
                    );
                }
            }
        }
    },
    renderMessages: function(display) {
        var messages = this._player.getMessages();
        var messageY = 0;
        var i;
        if (messages) {
            for (i = 0; i < messages.length; i++) {
                // Draw each message, adding the number of lines
                messageY += display.drawText(
                    this._mapOffsetX, 
                    messageY,
                    messages[i]
                );
            }
        }
    },
    renderInfoBar: function(display) {
        // Render player description
        var playerDesc = this._player.getRepresentation() + 
                ': ' + this._player.describeA(false);
        display.drawText(0, 0, playerDesc);
        
        // Render player health
        var playerHP = 'Health: ' + this._player.getHp() + '/' + this._player.getMaxHp();
        var hpBarLength = Game.getInfoBarWidth() * this._player.getHp() / this._player.getMaxHp();
        display.drawText(
            Math.floor((Game.getInfoBarWidth() / 2) - (playerHP.length / 2)), 
            1, 
            playerHP, 
            'white',
            'black'
        );
        for (let i = 0; i < Game.getInfoBarWidth(); i++) {
            
            if (i > hpBarLength) {
                display.drawOver(i, 1, '', null, "rgb(60,0,0)");
            } else if (hpBarLength - i < 1) {
                var redVal = Math.floor(60 + ((125-60) * (hpBarLength - i)));
                display.drawOver(i, 1, '', null, "rgb(" + redVal + ",0,0)");
            } else {
                display.drawOver(i, 1, '', null, "rgb(125,0,0)");
            }
        }
       
        // Render player attack and defense
        var playerStats = 
                'Atk: ' + this._player.getAttackValueWithoutDice() + 
                '+d' + this._player.getAttackDice() + 
                '  Def: ' + this._player.getDefenseValue(); 
        display.drawText(
            Math.floor((Game.getInfoBarWidth() / 2) - (playerStats.length / 2)), 
            2, 
            playerStats
        );

        // Render player's level bar
        var levelBar = '======>';
        var levelBarLength = 7;

        var n = Math.round(this._player.getCurrentLevelProgress() * levelBarLength - 1);
        var temp = levelBar.split('');
        temp.splice(0, levelBarLength - n - 1);
        levelBar = temp.join('');
        for (i = 0; i < levelBarLength - n; i++) {
            levelBar += '.';
        }
        var levelStats = 'Lvl: [%c{rgb(50,255,50)}' + this._player.getLevel() + 
            '%c{}' + levelBar + (this._player.getLevel()+1) + ']';
        display.drawText(
            Math.floor((Game.getInfoBarWidth() / 2) - ((levelStats.length - 22) / 2)),
            4,
            levelStats
        );
        var xpAmount = "XP: " + this._player.getExperience();
        display.drawText(
            Math.floor((Game.getInfoBarWidth() / 2) - ((levelStats.length - 22) / 2)) + 1,
            5,
            xpAmount
        );
        // show info for each visible entity
        let y = 7;
        let map = this._player.getMap();
        var entities = map.getEntitiesWithinRadius(
            this._player.getX(), 
            this._player.getY(), 
            this._player.getZ(), 
            this._player.getSightRadius()
        );
        if (entities) {
            for (let i = 0; i < entities.length; i++) {
                let entity = entities[i];
                if (entity !== this._player && 
                        this._visibleCells[entity.getX() + ',' + entity.getY()]) {
                    // Render entity description
                    let entityDesc = entity.getRepresentation() + 
                        ': ' + entity.describeA(false);
                    display.drawText(0, y++, entityDesc);
                    
                    // Render entity health
                    let entityHP = 'Health: ' + entity.getHp() + '/' + entity.getMaxHp();
                    hpBarLength = Game.getInfoBarWidth() * entity.getHp() / entity.getMaxHp();
                    display.drawText(
                        Math.floor((Game.getInfoBarWidth() / 2) - (entityHP.length / 2)), 
                        y, 
                        entityHP, 
                        'white',
                        'black'
                    );
                    for (let i = 0; i < Game.getInfoBarWidth(); i++) {
                        let scaleFactor = 0.3;
                        let color = "rgb(80, 49, 122)";
                        if (i > hpBarLength) {
                            display.drawOver(i, y, '', null, Game.scaleRGB(color, scaleFactor));
                        } else if (hpBarLength - i < 1) {
                            scaleFactor += (hpBarLength - i) * (1 - scaleFactor);
                            display.drawOver(i, y, '', null, Game.scaleRGB(color, scaleFactor));
                        } else {
                            display.drawOver(i, y, '', null, color);
                        }
                    }
                    y++;
                    // Render entity attack and defense
                    let entityStats = 
                        'Atk: ' + entity.getAttackValueWithoutDice() + 
                        '+d' + entity.getAttackDice() + 
                        '  Def: ' + entity.getDefenseValue(); 
                    display.drawText(
                        Math.floor((Game.getInfoBarWidth() / 2) - (entityStats.length / 2)), 
                        y++, 
                        entityStats
                    );
                    y++;
                }
            }
        }

        // show info for each visible item
        let items = this._player.getMap().getItemsWithinRadius(
            this._player.getX(), 
            this._player.getY(), 
            this._player.getZ(), 
            this._player.getSightRadius()
        );
        if (items) {
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                if (item) {
                    let itemPos = map.getItemPosition(item);
                    if (this._visibleCells[itemPos[0] + ',' + itemPos[1]]) {
                        // Render entity description
                        let itemRep = item.getRepresentation() + ':';
                        let itemDesc = ' ' + item.describeA(false);
                        display.drawText(0, y, itemRep, Game.getInfoBarWidth());
                        display.drawText(3, y, itemDesc, Game.getInfoBarWidth() - 3);
                        y += 2;
                    }
                }
            }
        }

        // Render player's current floor
        var currentFloor = this._player.getZ() + 1; 
        var playerFloor = 'Floor: ' + currentFloor;
        display.drawText(
            Math.floor((Game.getInfoBarWidth() / 2) - (playerFloor.length / 2)), 
            Game.getScreenHeight() - 1, 
            playerFloor
        );        
    },
    renderOptionsBar: function(display) {
        var width = Game.getMapWidth();
        var x = Game.getMapOffsetX() + 1;
        var y = Game.getScreenHeight() - 1;
        var buttonColor = 'rgb(0,10,50)';
        var highlightedButtonColor = 'rgb(40,40,140)';
        // render help button
        var helpButton = "%c{white}Help (%c{rgb(255,255,0)}?%c{white})";
        display.drawText(x, y, helpButton);
        for (let i = x - 1; i < x + helpButton.length - 36 + 1; i++) {
                if (this._selectedButton == 'helpButton' ||
                        (this._subScreen && this._subScreen == Game.Screen.helpScreen)) {
                    display.drawOver(i, y, '', null, highlightedButtonColor);
                } else {
                    display.drawOver(i, y, '', null, buttonColor);
                }
                
        }
        x += helpButton.length - 36 + 4;

        // render inventory button
        var inventoryButton = "%c{rgb(255,255,0)}I%c{white}nventory";
        display.drawText(x, y, inventoryButton);
        for (let i = x - 1; i < x + inventoryButton.length - 27 + 1; i++) {
            if (this._selectedButton == 'inventoryButton' ||
                    (this._subScreen && this._subScreen == Game.Screen.inventoryScreen)) {
                display.drawOver(i, y, '', null, highlightedButtonColor);
            } else {
                display.drawOver(i, y, '', null, buttonColor);
            }
        }
        x += inventoryButton.length - 27 + 4;

        // render look button
        var lookButton = "%c{rgb(255,255,0)}L%c{white}ook";
        display.drawText(x, y, lookButton);
        for (let i = x - 1; i < x + lookButton.length - 27 + 1; i++) {
            if (this._selectedButton == 'lookButton' ||
                    (this._subScreen && this._subScreen == Game.Screen.lookScreen)) {
                display.drawOver(i, y, '', null, highlightedButtonColor);
            } else {
                display.drawOver(i, y, '', null, buttonColor);
            }
        }
        x += lookButton.length - 27 + 4;

        // render statpoints button
        statPoints = '%c{rgb(255,255,0)}S%c{white}tat pts: ' + this._player.getStatPoints();
        if (this._player.getStatPoints() > 0) {
            display.drawText(x, y, statPoints);
        } else {
            display.drawText(x, y, statPoints, 'rgb(100,100,100)');
        }
        
        for (let i = x - 1; i < x + statPoints.length - 27 + 1; i++) {
            if (this._player.getStatPoints() > 0) {
                if (this._selectedButton == 'statPointsButton') {
                    display.drawOver(i, y, '', null, 'rgb(90, 161, 71)');
                } else {
                    display.drawOver(i, y, '', null, 'rgb(73, 130, 57)');
                }
            } else {
                display.drawOver(i, y, '', null, 'rgb(30,30,30)');
            } 
        }
    },
    renderLooking: function(display) {
        // Draw a line from the start to the cursor.
        var target = null;
        var points = this._player.getMap().findShortestPath(
            this._player.getZ(),
            this._player.getX(), 
            this._player.getY(),
            this._cursorX,
            this._cursorY,
            false,
            true // require path to be on explored tiles only
        );
        if (!points) {
            target = this._player.getMap().findClosestWalkableTile(
                this._player.getZ(),
                this._cursorX,
                this._cursorY,
                true // require path to be on explored tiles only
            );
            if (target) {
                points = this._player.getMap().findShortestPath(
                    this._player.getZ(),
                    this._player.getX(), 
                    this._player.getY(),
                    target.x,
                    target.y,
                    false,
                    true // require path to be on explored tiles only
                );
            }
        }
        var map = this._player.getMap();
        // Render stars along the line.
        if (points) {
            for (var i = 1; i < points.length; i++) {
                if (map.isExplored(points[i].x, points[i].y, this._player.getZ())) {
                    var tile = map.getTile(points[i].x, points[i].y, this._player.getZ());
                    if (this._visibleCells[points[i].x + ',' + points[i].y]) {
                        var items = map.getItemsAt(points[i].x, points[i].y, this._player.getZ());
                        if (items) {
                            tile = items[items.length - 1];
                        }
                        if (map.getEntityAt(points[i].x, points[i].y, this._player.getZ())) {
                            tile = map.getEntityAt(points[i].x, points[i].y, this._player.getZ());
                        }
                    }
                    var foreground = tile.getForeground();
                    if (i == points.length - 1) {
                        if (points[i].x == this._cursorX &&
                                points[i].y == this._cursorY) {
                            // if cursor is on path, highlight cursor there
                            display.drawText(
                                points[i].x + Game.getMapOffsetX(), 
                                points[i].y + Game.getMapOffsetY(),
                                '%c{rgb(100,100,100)}%b{rgba(255,255,255,0.9)}' + tile.getChar()
                            );
                        } else {
                            // else, render the end of path normally...
                            display.drawText(
                                points[i].x + Game.getMapOffsetX(), 
                                points[i].y + Game.getMapOffsetY(),
                                '%c{' + foreground + '}%b{rgba(255,165,0,0.3)}' + tile.getChar()
                            );
                            // ...and then highlight cursor
                            if (this._player.getMap().isExplored(
                                    this._cursorX, 
                                    this._cursorY, 
                                    this._player.getZ()
                                )) {
                                display.drawText(
                                    this._cursorX + Game.getMapOffsetX(), 
                                    this._cursorY + Game.getMapOffsetY(),
                                    '%c{rgb(100,100,100)}%b{rgba(255,255,255,0.9)}' + 
                                        this._player.getMap().getTile(
                                                this._cursorX, 
                                                this._cursorY, 
                                                this._player.getZ()).getChar()
                                        );
                            } else {
                                display.drawText(
                                    this._cursorX + Game.getMapOffsetX(), 
                                    this._cursorY + Game.getMapOffsetY(),
                                    '%c{rgb(100,100,100)}%b{rgba(255,255,255,0.9)}?'
                                );
                            }
                            
                        }
                        
                    } else {
                        display.drawText(
                            points[i].x + Game.getMapOffsetX(), 
                            points[i].y + Game.getMapOffsetY(),
                            '%c{' + foreground + '}%b{rgba(255,165,0,0.3)}' + tile.getChar()
                        );
                    }
                    
                }
            }
        }
        display.drawText(
            Game.getMapOffsetX(),
            Game.getScreenHeight() - 2,
            "%c{rgb(0,220,220)}" + this.getLookCaption()
        );
    },
    getLookCaption: function() {
        let x = this._cursorX;
        let y = this._cursorY;
        let z = this._player.getZ();
        let map = this._player.getMap();
        // If the tile is explored, we can give a better capton
        if (map.isExplored(x, y, z)) {
            // If the tile isn't explored, we have to check if we can actually 
            // see it before testing if there's an entity or item.
            if (this._visibleCells[x + ',' + y]) {
                let items = map.getItemsAt(x, y, z);
                // If we have items, we want to render the top most item
                if (items) {
                    let item = items[items.length - 1];
                    return sprintf('You see %s. (%s)',
                        item.describeA(false),
                        item.getDetails());
                // Else check if there's an entity
                } else if (map.getEntityAt(x, y, z)) {
                    var entity = map.getEntityAt(x, y, z);
                    return sprintf('You see %s.',
                        entity.describeA(false));
                } else {
                    // If there was no entity/item or the tile wasn't visible, then use
                    // the tile information.
                    return sprintf('You see %s.',
                        map.getTile(x, y, z).getDescription());
                }
            } else {
                let items = map.getItemsAt(x, y, z);
                // If we have items, we want to render the top most item
                if (items) {
                    let item = items[items.length - 1];
                    return sprintf('You remember seeing %s. (%s)',
                        item.describeA(false),
                        item.getDetails());
                }
                // If the tile is explored but not visible, then use
                // the tile information.
                return sprintf('You remember seeing %s.',
                    map.getTile(x, y, z).getDescription());
            }
        } else {
            // If the tile is not explored, show the null tile description.
            return '';
        }
    },
    moveCursor: function(dx, dy) {
        // Make sure we stay within bounds.
        var newCursorX = Math.max(0, Math.min(this._cursorX + dx, Game.getMapWidth()));
        // We have to save the last line for the caption.
        var newCursorY = Math.max(0, Math.min(this._cursorY + dy, Game.getMapHeight()));
        
        this._cursorX = newCursorX;
        this._cursorY = newCursorY;
    },
    moveCursorTo: function(x, y) {
        // Make sure we stay within bounds.
        var newCursorX = Math.max(0, Math.min(x, Game.getMapWidth()));
        // We have to save the last line for the caption.
        var newCursorY = Math.max(0, Math.min(y, Game.getMapHeight()));
        
        this._cursorX = newCursorX;
        this._cursorY = newCursorY;
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
            if ([37, 52, 100].includes(inputData.keyCode)) { // left/both 4's   
                this.move(-1, 0, 0);
            } else if ([38, 56, 104].includes(inputData.keyCode)) { // up/both 8's
                this.move(0, -1, 0);
            } else if ([39, 54, 102].includes(inputData.keyCode)) { // right/both 6's
                this.move(1, 0, 0);
            } else if ([40, 50, 98].includes(inputData.keyCode)) { // down/both 2's
                this.move(0, 1, 0);
            } else if ([55, 103].includes(inputData.keyCode)) { // up-left/both 7's
                this.move(-1, -1, 0);
            } else if ([57, 105].includes(inputData.keyCode)) { // up-right/both 9's
                this.move(1, -1, 0);
            } else if ([51, 99].includes(inputData.keyCode)) { // down-right/both 3's
                this.move(1, 1, 0);
            } else if ([49, 97].includes(inputData.keyCode)) { // down-left/both 1's
                this.move(-1, 1, 0);
            } else if (inputData.key === '.' || [53, 101].includes(inputData.keyCode)) { // wait
                this.move(0, 0, 0);   
            } else if (inputData.key === 'Enter') {
                var tile = map.getTile(
                    this._player.getX(), 
                    this._player.getY(), 
                    this._player.getZ()
                );
                if (tile.isStairsUp()) {
                    this.move(0, 0, -1);
                } else if (tile.isStairsDown() ||
                        tile.isHoleToCavern()) {
                    this.move(0, 0, 1);
                }
            } else if (inputData.key === 'i') { // inventory
                if (this._player.getItems().filter(function(x){return x;}).length === 0) {
                    // If the player has no items, send a message and don't take a turn
                    Game.sendMessage(this._player, "You're not carrying anything.");
                    Game.refresh();
                } else {
                    // Show the inventory
                    Game.Screen.inventoryScreen.setup(this._player, this._player.getItems());
                    this.setSubScreen(Game.Screen.inventoryScreen);
                }
                this._looking = false;
                return;
            } else if (inputData.key === 'h') { // quick-heal
                if (this._player.healWithItem()) {
                    map.getEngine().unlock();
                }
                this._looking = false;
                Game.refresh();
                return;
            } else if (inputData.key === 'l') { // look
                // Setup the look screen.
                Game.sendMessage(this._player, "You look around. Press [Esc] to cancel.");
                Game.Screen.lookScreen.setup(this._player,
                    this._player.getX(), this._player.getY());
                this.setSubScreen(Game.Screen.lookScreen);
                this._looking = false;
                return;
            } else if (inputData.key === 'f') { // fire (aim)
                // Setup the aim screen.
                if (this._player.getWeapon() && this._player.getWeapon().isRanged()) {
                    Game.sendMessage(this._player, "Press [f] to fire or [Esc] to cancel.");
                    Game.Screen.aimScreen.setup(this._player,
                        this._player.getX(), this._player.getY());
                    this.setSubScreen(Game.Screen.aimScreen);                
                } else {
                    Game.sendMessage(this._player, "You're not holding anything to aim with.");
                    Game.refresh();
                }
                this._looking = false;
                return;
            } else if (inputData.key === 's')  { // stat points
                if (this._player.getStatPoints() > 0) {
                    this._player.useStatPoints();
                }
                this._looking = false;
            } else {
                return;
            }
        } else if (inputType === 'keypress') {
            var keyChar = String.fromCharCode(inputData.charCode);
            if (keyChar === '?') { // help
                // Setup the help screen.
                console.log("loading helpScreen");
                this.setSubScreen(Game.Screen.helpScreen);
                this._looking = false;
                return;
            }
        } else if (inputType === 'mousemove') {
            let screenX = Math.floor((inputData.clientX - Game._screenOffsetX) / Game._screenCellWidth);
            let screenY = Math.floor((inputData.clientY - Game._screenOffsetY) / Game._screenCellHeight);
            
            let x = screenX - Game.getMapOffsetX();
            let y = screenY - Game.getMapOffsetY();

            if (x >= 0 && x < Game.getMapWidth() &&
                    y >= 0 && y < Game.getMapHeight()) {
                this._looking = true;
                if (x !== this._cursorX || y !== this._cursorY) {
                    this.moveCursorTo(x, y);
                    Game.refresh();
                }
            } else {
                if (screenX >= Game.getMapOffsetX() &&
                        screenX < Game.getMapOffsetX() + 10 &&
                        screenY == Game.getScreenHeight() - 1) {
                    // highlight the help button
                    this._selectedButton = 'helpButton';
                } else if (screenX >= Game.getMapOffsetX() + 12 &&
                        screenX < Game.getMapOffsetX() + 23 &&
                        screenY == Game.getScreenHeight() - 1) {
                    // highlight the inventory button
                    this._selectedButton = 'inventoryButton';
                } else if (screenX >= Game.getMapOffsetX() + 25 &&
                        screenX < Game.getMapOffsetX() + 31 &&
                        screenY == Game.getScreenHeight() - 1) {
                    // highlight the look button
                    this._selectedButton = 'lookButton';
                } else if (screenX >= Game.getMapOffsetX() + 33 &&
                        screenX < Game.getMapOffsetX() + 47 &&
                        screenY == Game.getScreenHeight() - 1) {
                    // highlight the stat points button
                    this._selectedButton = 'statPointsButton';
                }
                else {
                    this._selectedButton = null;
                }
                this._looking = false;
                Game.refresh();
            }
            
        } 
        else if (inputType === 'click') {
            let screenX = Math.floor((inputData.clientX - Game._screenOffsetX) / Game._screenCellWidth);
            let screenY = Math.floor((inputData.clientY - Game._screenOffsetY) / Game._screenCellHeight);
            
            let x = screenX - Game.getMapOffsetX();
            let y = screenY - Game.getMapOffsetY();
            
            if (x >= 0 && x < Game.getMapWidth() &&
                y >= 0 && y < Game.getMapHeight()) {
                var path = this._player.getMap().findShortestPath(
                    this._player.getZ(), this._player.getX(), this._player.getY(),
                    x, y, false, true // require use of explored tiles only
                );
                if (!path) {
                    var target = this._player.getMap().findClosestWalkableTile(
                        this._player.getZ(), x, y, true // require path to be on explored tiles only
                    );
                    if (target) {
                        path = this._player.getMap().findShortestPath(
                            this._player.getZ(), this._player.getX(), this._player.getY(),
                            target.x, target.y, false, true // require path to be on explored tiles only
                        );
                    }
                }
    
                const sleep = (milliseconds) => {
                    return new Promise(resolve => setTimeout(resolve, milliseconds));
                };
    
                const moveLoop = async (path) => {
                    for (let i = 1; i < path.length; i++) {
                        await sleep(35);
                        if (this._gameEnded) {
                            return;
                        }
                        var entities = map.getEntitiesWithinRadius(
                                path[i].x, 
                                path[i].y, 
                                this._player.getZ(), 
                                1
                        );
                        var blocked = (!entities || entities.length > 1);
                        this.moveTo(path[i].x, path[i].y, this._player.getZ());
                        if (blocked || this._player._forceManual) {
                            return;
                        }
                    }
                };
                if (path) {
                    moveLoop(path);
                    this._looking = false; 
                }
                else {
                    Game.sendMessage(this._player, "You can't move there!");
                }
            } else { // check if a button was clicked
                if (screenX >= Game.getMapOffsetX() &&
                        screenX < Game.getMapOffsetX() + 10 &&
                        screenY == Game.getScreenHeight() - 1) {
                    // setup the help screen
                    console.log("loading helpScreen");
                    this.setSubScreen(Game.Screen.helpScreen);
                    this._selectedButton = null;
                    return;
                } else if (screenX >= Game.getMapOffsetX() + 12 &&
                        screenX < Game.getMapOffsetX() + 23 &&
                        screenY == Game.getScreenHeight() - 1) {
                    // setup the inventory screen
                    if (this._player.getItems().filter(function(x){return x;}).length === 0) {
                        // If the player has no items, send a message and don't take a turn
                        Game.sendMessage(this._player, "You're not carrying anything.");
                        Game.refresh();
                    } else {
                        // Show the inventory
                        Game.Screen.inventoryScreen.setup(this._player, this._player.getItems());
                        this.setSubScreen(Game.Screen.inventoryScreen);
                    }
                    this._looking = false;
                    this._selectedButton = null;
                    return;
                } else if (screenX >= Game.getMapOffsetX() + 25 &&
                        screenX < Game.getMapOffsetX() + 31 &&
                        screenY == Game.getScreenHeight() - 1) {
                    // setup the look screen
                    Game.sendMessage(this._player, "You look around. Press [Esc] to cancel.");
                    Game.Screen.lookScreen.setup(this._player,
                        this._player.getX(), this._player.getY());
                    this.setSubScreen(Game.Screen.lookScreen);
                    this._looking = false;
                    this._selectedButton = null;
                    return;
                } else if (screenX >= Game.getMapOffsetX() + 33 &&
                        screenX < Game.getMapOffsetX() + 47 &&
                        screenY == Game.getScreenHeight() - 1) {
                    // setup the stat screen
                    if (this._player.getStatPoints() > 0) {
                        this._player.useStatPoints();
                    }
                    this._looking = false;
                    this._selectedButton = null;
                    return;
                }
            }
        }
    },

    setGameEnded: function(gameEnded) {
        this._gameEnded = gameEnded;
    },

    move: function(dX, dY, dZ) {
        this._looking = false; 
        var newX = this._player.getX() + dX;
        var newY = this._player.getY() + dY;
        var newZ = this._player.getZ() + dZ;
        if (dZ != 0) {
        }
        // Try to move to the new cell
        this._player.tryMove(newX, newY, newZ);
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
        this._player.tryMove(newX, newY, newZ);
        // Unlock the engine
        this._player.getMap().getEngine().unlock();
    },
    setSubScreen: function(subScreen) {
        if (subScreen) {
            this._looking = false;
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

//#region ItemListScreen
Game.Screen.ItemListScreen = function(template) {
    // Set up based on the template
    this._caption = template.caption;
    this._okFunction = template.ok;
    this._selectOptionFunction = template.selectOption;
    // Whether a 'no item' option should appear.
    this._hasNoItemOption = template.hasNoItemOption;
    //
    this._hasOptionsMenu = template.hasOptionsMenu;
    this._optionsOpen = false;
    // By default, we use the identity function
    this._isAcceptableFunction = template.isAcceptable || function(x) {
        return x;
    };
    // Whether the user can select items at all.
    this._canSelectItem = template.canSelect;
    // Whether the user can select multiple items.
    this._canSelectMultipleItems = template.canSelectMultipleItems;
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
    var itemsStacked = [];
    for (var i = 0; i < this._items.length; i++) {
        var item = this._items[i];
        if (item) {
            var idx = itemsStacked.findIndex(element => element[0] !== undefined && element[0].getName() == item.getName());
            if (idx !== -1) {
                itemsStacked[idx].push(item);
            } else {
                itemsStacked.push([item]);
            }
        }
    }
    this._items = itemsStacked;

    // Clean set of selected indices
    this._selectedIndices = {};
    this._selectedOption = null;
    return count;
};
Game.Screen.ItemListScreen.prototype.render = function(display) {
    var letters = 'abcdefghijklmnopqrstuvwxyz';
    
    // Render the no item row if enabled
    var width = Math.floor(2 * Game.getMapWidth() / 3);
    var height = this._items.length + 2;
    var left = Math.floor((Game.getMapWidth() / 2) - (width / 2)) + Game.getMapOffsetX();
    var top = Math.floor((Game.getMapHeight() / 2) - (height / 2)) + Game.getMapOffsetY();

    if (this._hasNoItemOption) {
        height += 3;
    }
    
    // Render the caption in the top row
    display.drawText(
        Math.floor((Game.getMapWidth() / 2) - (this._caption.length / 2)) + Game.getMapOffsetX(), 
        top, 
        this._caption
    );

    for (let i = left; i < left + width; i++) {
        for (let j = top; j < top + height; j++) {
            if (i == left && j == top) {
                display.draw(i, j, '┌');
            } else if (i == left + width - 1 && j == top) {
                display.draw(i, j, '┐');
            } else if (i == left && j == top + height - 1) {
                display.draw(i, j, '└');
            } else if (i == left + width - 1 && j == top + height - 1) {
                display.draw(i, j, '┘');
            }
            else if (j == top || j == top + height - 1) {
                display.draw(i, j, '─');
            }   else if (i == left || i == left + width - 1) {
                display.draw(i, j, '│');
            } else {
                display.draw(i, j, ' ');
            }
            
        }
    }
    var x = left + 1;
    var y = top;
    display.drawText(
        Math.floor((Game.getMapWidth() / 2) - (this._caption.length / 2)) + Game.getMapOffsetX(), 
        y, 
        this._caption
    );
    y ++;
    if (this._hasNoItemOption) {
        display.drawText(x, y, '0 - no item');
        y++;
    }
    var row = 0;
    var item;
    for (var i = 0; i < this._items.length; i++) {
        // If we have an item, we want to render it.
        if (this._items[i] && this._items[i][0]) {
            item = this._items[i][0];
            // Get the letter matching the item's index
            var letter = letters.substring(i, i + 1);
            // If we have selected an item, show a +, else show a dash between
            // the letter and the item's name.
            var selectionState = (this._canSelectItem && this._canSelectMultipleItems &&
                this._selectedIndices[i]) ? '+' : '-';
            // Check if the item is worn or wielded
            var prefix = '';
            if (item.hasMixin(Game.ItemMixins.Equippable)) {
                prefix += "%c{rgb(100,230,125)}" + item.getAttackDefense() + "%c{}" + ' ';
            }
            var suffix = '';
            // If euipped item is part of a stack and it's not the one being displayed,
            // still show that on of them is equipped
            for (var j = 0; j < this._items[i].length; j++) {
                if (this._items[i][j] === this._player.getArmor()) {
                    suffix += '(equipped)';
                    break;
                } else if (this._items[i][j] === this._player.getWeapon()) {
                    suffix += '(equipped)';
                    break;
                }
            }
            
                // Render at the correct row and add 2.
            var numItems = '';
            if (this._items[i].length > 1) {
                numItems += this._items[i].length;
                display.drawText(x, y, letter + ' ' + selectionState + ' ' + 
                    item.getRepresentation() + ' ' + '%c{darkgray}' + numItems + ' ' + 
                    '%c{}' + prefix + 
                    '%c{white}' + item.describe(true) + ' ' + 
                    '%c{darkgray}' + suffix
                );
            } else {
                display.drawText(x, y, letter + ' ' + selectionState + ' ' + 
                item.getRepresentation() + ' ' + prefix + 
                '%c{white}' + item.describe()  + ' ' + 
                '%c{darkgray}' + suffix);
            }
            y++;
            
        }
        
        if (this._hasOptionsMenu && this._optionsOpen) {
            var optionsDisplay = [
                '┌───────── Options ─────────┐',
                '│  apply [a]     equip [e]  │',
                '│  examine [x]   drop [d]   │',
                '│  cancel [esc]             │',
                '└───────────────────────────┘'
            ];
            if (this._selectedIndices) {
                var key = Object.keys(this._selectedIndices)[0];
                item = this._items[key][this._items[key].length - 1];
                if (item && item.hasMixin('Equippable') && 
                        (item == this._player.getWeapon() || 
                         item == this._player.getArmor())) {
                    optionsDisplay = [
                        '┌────────── Options ──────────┐',
                        '│  apply [a]     unequip [e]  │',
                        '│  examine [x]   drop [d]     │',
                        '│  cancel [esc]               │',
                        '└─────────────────────────────┘'
                    ];
                }
            }
            var optionsWidth = optionsDisplay[0].length;
            var optionsHeight = optionsDisplay.length;
            var optionsX = Math.floor((Game.getMapWidth() / 2) - (optionsWidth / 2)) + Game.getMapOffsetX();
            var optionsY = top + 1;

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
        selectedItems[key] = this._items[key][this._items[key].length - 1];
    }

    this._selectOptionFunction(selectedItems, this._selectedOption);
    this._selectedOption = null;
};

Game.Screen.ItemListScreen.prototype.executeOkFunction = function() {
    // Gather the selected items.
    var selectedItems = {};
    for (var key in this._selectedIndices) {
        selectedItems[key] = this._items[key][this._items[key].length - 1];
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
//#endregion

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
        if (!item) {
            return;
        }
        if (option === 'a') {
            if (item && item.hasMixin('Healing')) {
                Game.sendMessage(this._player, "You consume %s.", [item.describeThe()]);         
                item.consume(this._player);
                
                this._player.removeItemByObject(item);    
                this._items[key].pop();
                
                this._optionsOpen = false;
                Game.refresh();
            } else if (item && item.hasMixin('Scroll')) { 
                Game.sendMessage(this._player, "You activate %s.", [item.describeThe()]);
                Game.Screen.aimScreen.setup(this._player,
                    this._player.getX(), this._player.getY(), item);
                this._optionsOpen = false;
                Game.refresh();
                Game.Screen.playScreen.setSubScreen(Game.Screen.aimScreen);
            }
            else {
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
            Game.refresh();
        } else if (option === 'd') {
            //Game.sendMessage(this._player, "You drop %s.", [item.describeThe()]);
            var wasWielding = item === this._player.getWeapon();
            var wasWearing = item === this._player.getArmor();
            this._player.dropItemByObject(item);
            this._items[key].pop();
            // If an equipped item gets dropped that the player has multiple of,
            // equip a different item with the same name
            if (this._items[key] && this._items[key][0]) {
                if (wasWielding) {
                    this._player.wield(this._items[key][this._items[key].length-1]);
                } else if (wasWearing) {
                    this._player.wear(this._items[key][this._items[key].length-1]);
                }
            }

            this._optionsOpen = false;
            this._selectedIndices = {};
            Game.refresh();
        }
    },
    ok: function(selectedItems) {
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
        
        var width = Math.floor((2 * Game.getMapWidth() / 3)) + 1;
        var height = this._options.length + 4;
        var left = Math.floor((Game.getMapWidth() / 2) - (width / 2)) + Game.getMapOffsetX();
        var top = Math.floor((Game.getMapHeight() / 2) - (height / 2)) + Game.getMapOffsetY();
        for (let i = left; i < left + width; i++) {
            for (let j = top; j < top + height; j++) {
                if (i == left && j == top) {
                    display.draw(i, j, '┌');
                } else if (i == left + width - 1 && j == top) {
                    display.draw(i, j, '┐');
                } else if (i == left && j == top + height - 1) {
                    display.draw(i, j, '└');
                } else if (i == left + width - 1 && j == top + height - 1) {
                    display.draw(i, j, '┘');
                }
                else if (j == top || j == top + height - 1) {
                    display.draw(i, j, '─');
                }   else if (i == left || i == left + width - 1) {
                    display.draw(i, j, '│');
                } else {
                    display.draw(i, j, ' ');
                }
                
            }
        }

        display.drawText(
            Math.floor((Game.getMapWidth() / 2) - (caption.length / 2)) + Game.getMapOffsetX(), 
            top, 
            caption
        );

        var x = left + 2;
        var y = top + 2;

        // Iterate through each of our options
        for (var i = 0; i < this._options.length; i++) {
            display.drawText(
                x, 
                y++,
                letters.substring(i, i + 1) + ' - ' + this._options[i][0]
            );
        }

        y += 2;
        var remainingPoints = "Remaining points: " + this._entity.getStatPoints();

        // Render remaining stat points
        display.drawText(
            Math.floor((Game.getMapWidth() / 2) - (remainingPoints.length / 2)) + Game.getMapOffsetX(), 
            top + height - 1,
            remainingPoints
        );   
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
        var text =   'Back to Life! - Help';
        var border = '--------------------';
        var x = Game.getMapOffsetX();
        var y = 1;
        /*
        for (let i = x; i < i + Game.getMapWidth(); i++) {
            for (let j = y; j < y + Game.getMapHeight(); j++) {
                //display.draw(i, j, ' ');
            }
        }*/
        
        display.drawText((Game.getMapWidth() / 2) - (text.length / 2) + x, y++, text);
        display.drawText((Game.getMapWidth() / 2) - (text.length / 2) + x, y++, border);
        //display.drawText(0, y++, "You've been wrongly sent to Hell. Find the Ruler of Hell and defeat him to come back to life!");
        y++;
        display.drawText(x, y++, 'Controls:');
        y++;
        display.drawText(x, y++, 'Arrow keys/numpad/mouse to move');
        display.drawText(x, y++, '[Enter] to use stairs/fire bows/activate scrolls');
        display.drawText(x, y++, '[c] to cycle targets while aiming');
        display.drawText(x, y++, '[f] to aim, press again to fire');
        display.drawText(x, y++, '[h] to heal with item');
        display.drawText(x, y++, '[i] to open inventory');
        display.drawText(x, y++, '[l] to look around you');
        display.drawText(x, y++, '[s] to use stat points');
        display.drawText(x, y++, '[5] or [.] to wait a turn');
        display.drawText(x, y++, '[?] to show this help screen');
        y ++;
        text = '--- press any key to continue ---';
        display.drawText(
            (Game.getMapWidth() / 2) - (text.length / 2) + x, 
            y++,
            text
        );
    },
    handleInput: function(inputType, inputData) {
        if (inputType === 'keydown')
        Game.Screen.playScreen.setSubScreen(null);
    }
};

//#region TargetBasedScreen
Game.Screen.TargetBasedScreen = function(template) {
    template = template || {};
    // By default, our ok return does nothing and does not consume a turn.
    this._isAcceptableFunction = template.okFunction || function(x, y) {
        return false;
    };
    // The defaut caption function simply returns an empty string.
    this._captionFunction = template.captionFunction || function(x, y) {
        return '';
    };
};

Game.Screen.TargetBasedScreen.prototype.setup = function(player, startX, startY, item) {
    this._player = player;
    // Store original position. Subtract the offset to make life easy so we don't
    // always have to remove it.
    this._startX = startX;
    this._startY = startY;
    // Store current cursor position
    this._cursorX = this._startX;
    this._cursorY = this._startY;
    this._caption = '';
    this._item = item;
    // Cache the FOV
    var visibleCells = {};
    this._player.getMap().computeFov(
        this._player.getX(), this._player.getY(),
        this._player.getZ(), 
        this._player.getSightRadius(), 
        function(x, y, radius, visibility) {
            visibleCells[x + "," + y] = true;
        });
    this._visibleCells = visibleCells;
    // cache available targets
    this._availableTargets = [];
    var entities = this._player.getMap().getEntitiesWithinRadius(
            this._player.getX(), 
            this._player.getY(), 
            this._player.getZ(), 
            this._player.getSightRadius()
    );
    for (var i = 0; i < entities.length; i++) {
        if (entities[i] && !entities[i].hasMixin('PlayerActor') && visibleCells[entities[i].getX() + "," + entities[i].getY()]){
            this._availableTargets.push(entities[i]);
        }
    }
    this._currentTargetIndex = this._availableTargets.length > 0 ? this._availableTargets.length - 1 : 0;
    this.cycleCursorTarget();
};

Game.Screen.TargetBasedScreen.prototype.render = function(display) {    
    // Draw a line from the start to the cursor.
    var points = Game.getLine(this._startX, this._startY, this._cursorX,
        this._cursorY);
    var map = this._player.getMap();
    // Render stars along the line.
    for (var i = 0; i < points.length; i++) {
        if (i == 0) {
            display.drawText(
                points[i].x + Game.getMapOffsetX(), 
                points[i].y + Game.getMapOffsetY(), 
                '%b{rgba(255,165,0,0.3)}@'
            );
        } else {
            if (this._visibleCells[points[i].x + "," + points[i].y]) {
                var tile = map.getTile(points[i].x, points[i].y, this._player.getZ());
                var items = map.getItemsAt(points[i].x, points[i].y, this._player.getZ());
                
                if (items) {
                    tile = items[items.length - 1];
                }
                if (map.getEntityAt(points[i].x, points[i].y, this._player.getZ())) {
                    tile = map.getEntityAt(points[i].x, points[i].y, this._player.getZ());
                }
                var foreground = tile.getForeground();
                display.drawText(
                    points[i].x + Game.getMapOffsetX(), 
                    points[i].y + Game.getMapOffsetY(),
                    '%c{' + foreground + '}%b{rgba(255,165,0,0.3)}' + tile.getChar()
                );
            }
        }
    }

    // Render the caption at the bottom.
    this._caption = this._captionFunction(this._cursorX, this._cursorY);
    display.drawText(
        Game.getMapOffsetX(),
        Game.getScreenHeight() - 2,
        "%c{rgb(0,220,220)}" + this._caption
    );
};

Game.Screen.TargetBasedScreen.prototype.handleInput = function(inputType, inputData) {
    // Move the cursor
    if (inputType === 'keydown') {
        if ([67].includes(inputData.keyCode)) { // c to cycle cursor target
            this.cycleCursorTarget();
        } else if ([37, 100].includes(inputData.keyCode)) { // left
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
        } else if (inputData.keyCode === VK_RETURN || 
            inputData.key === 'f') {
            this.executeOkFunction();
        }
    } else if (inputType === 'mousemove') {
        var x = Math.floor(((inputData.clientX - Game._screenOffsetX) / Game._screenCellWidth) - Game.getMapOffsetX());
        var y = Math.floor(((inputData.clientY - Game._screenOffsetY) / Game._screenCellHeight) - Game.getMapOffsetY());
        if (x !== this._cursorX || y !== this._cursorY) {
            this.moveCursorTo(x, y);
        }
    }
    Game.refresh();
};

Game.Screen.TargetBasedScreen.prototype.moveCursor = function(dx, dy) {
    
    // Make sure we stay within bounds.
    var newCursorX = Math.max(0, Math.min(this._cursorX + dx, Game.getMapWidth()));
    var newCursorY = Math.max(0, Math.min(this._cursorY + dy, Game.getMapHeight()));
    
    this._cursorX = newCursorX;
    this._cursorY = newCursorY;
};

Game.Screen.TargetBasedScreen.prototype.moveCursorTo = function(x, y) {
    
    // Make sure we stay within bounds.
    var newCursorX = Math.max(0, Math.min(x, Game.getMapWidth()));
    var newCursorY = Math.max(0, Math.min(y, Game.getMapHeight()));
    
    this._cursorX = newCursorX;
    this._cursorY = newCursorY;
};

Game.Screen.TargetBasedScreen.prototype.cycleCursorTarget = function() {
    if (!this._availableTargets) {
        return;
    }
    // increment index to next available target
    this._currentTargetIndex++;
    if (this._currentTargetIndex > this._availableTargets.length - 1) {
        this._currentTargetIndex = 0;
    }
    // move cursor to newly selected target
    var target = this._availableTargets[this._currentTargetIndex];
    if (target) {
        this.moveCursorTo(target.getX(), target.getY());
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
//#endregion

Game.Screen.lookScreen = new Game.Screen.TargetBasedScreen({
    captionFunction: function(x, y) {
        var z = this._player.getZ();
        var map = this._player.getMap();
        // If the tile is explored, we can give a better capton
        if (map.isExplored(x, y, z)) {
            // If the tile isn't explored, we have to check if we can actually 
            // see it before testing if there's an entity or item.
            if (this._visibleCells[x + ',' + y]) {
                let items = map.getItemsAt(x, y, z);
                // If we have items, we want to render the top most item
                if (items) {
                    let item = items[items.length - 1];
                    return sprintf('You see %s. (%s)',
                        item.describeA(false),
                        item.getDetails());
                // Else check if there's an entity
                } else if (map.getEntityAt(x, y, z)) {
                    var entity = map.getEntityAt(x, y, z);
                    return sprintf('You see %s.',
                        entity.describeA(false));
                } else {
                    // If there was no entity/item or the tile wasn't visible, then use
                    // the tile information.
                    return sprintf('You see %s.',
                        map.getTile(x, y, z).getDescription());
                }
            } else {
                let items = map.getItemsAt(x, y, z);
                // If we have items, we want to render the top most item
                if (items) {
                    let item = items[items.length - 1];
                    return sprintf('You remember seeing %s. (%s)',
                        item.describeA(false),
                        item.getDetails());
                }
                // If the tile is explored but not visible, then use
                // the tile information.
                return sprintf('You remember seeing %s.',
                    map.getTile(x, y, z).getDescription());
            }
        } else {
            // If the tile is not explored, show the null tile description.
            return '';
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
        if (this._item && this._item.hasMixin('Scroll')) {
            this._player.activateScroll(x, y, this._item);
            this._player.removeItemByObject(this._item);
        } else {
            this._player.rangedAttack(x, y);
        }
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
            display.drawText(
                Game.getMapOffsetX() + 2, 
                i + Game.getMapOffsetY() + 1, 
                "%b{" + background + "}You win!"
            );
        }
    },
    handleInput: function(inputType, inputData) {
        // Nothing to do here      
    }
};

// Define our winning screen
Game.Screen.loseScreen = {
    enter: function() {    console.log("Entered lose screen."); },
    exit: function() { console.log("Exited lose screen."); },
    render: function(display) {
        // Render our prompt to the screen
        for (var i = 0; i < 22; i++) {
            display.drawText(
                Game.getMapOffsetX() + 2, 
                i + Game.getMapOffsetY() + 1, 
                "%b{red}You lose! :("
            );
        }
    },
    handleInput: function(inputType, inputData) {
        // Nothing to do here      
    }
};