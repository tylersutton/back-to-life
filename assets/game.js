Object.prototype.extend = function(a) {
    this.prototype=Object.create(a.prototype);
    this.prototype.constructor = this;
    return this;
    };

var Game = {
	_display: null,
	_currentScreen: null,
	_screenWidth: null,
    _screenHeight: null,
    _screenOffsetX: 0,
    _screenOffsetY: 0,
    _screenCellWidth: 25,
    _screenCellHeight: 25,
    _infoBarWidth: 20,
    _mapWidth: 70,
    _mapHeight: 21,
    _mapOffsetX: null, //statWidth + 1
    _mapOffsetY: null,
    _messageHeight: 3,
    _fontSize: 40,
    _menuScreenWidth: 50,
    _uiWidth: 100,
    _uiHeight: 9,
    _uiFontSize: 24,

    init: function() {
	    // Any necessary initialization will go here.
	    this._mapOffsetX = this._infoBarWidth + 1;
        this._mapOffsetY = this._messageHeight;
        this._screenWidth = this._infoBarWidth + this._mapWidth + 2;
        this._screenHeight = this._mapOffsetY + this._mapHeight + 2;

        var options = {
            width: this._screenWidth,
            height: this._screenHeight,
            fontSize: this._fontSize,
            bg: "rgb(0,0,0)",
            spacing: 1.2,
            fontFamily: "Consolas, monospace"
        };
        this._display = new ROT.Display(options);
        this._display.getContainer().setAttribute('id', "game");

	    // Create a helper function for binding to an event
	    // and making it send it to the screen
        var game = this; // So that we don't lose this
	    var lastMove = 0;
document.addEventListener('mousemove', function() {
    
});
        var bindEventToScreen = function(event) {
	        window.addEventListener(event, function(e) {
	            // When an event is received, send it to the
	            // screen if there is one
	            // also need to throttle mousemove events for performance
                if (event === 'mousemove') {
                    // do nothing if last move was less than 40 ms ago
                    if(Date.now() - lastMove > 40 && game._currentScreen !== null) {
                        // Send the event type and data to the screen
	                    game._currentScreen.handleInput(event, e);
                        lastMove = Date.now();
                    }
                } else if (game._currentScreen !== null) {
	                // Send the event type and data to the screen
	                game._currentScreen.handleInput(event, e);
	            } 
	        });
	    };
	    // Bind keyboard input events
	    bindEventToScreen('keydown');
	    bindEventToScreen('keyup');
	    bindEventToScreen('keypress');
        bindEventToScreen('click');
        bindEventToScreen('mousemove');
        window.addEventListener('resize', this.resizeDisplay);
        window.addEventListener('fullscreenchange', this.resizeDisplay);

        // setup game audio
        this.audio = new Game.Audio();
	},
    resizeDisplay: function() {
        var currentWidth = Game.getDisplay().getContainer().clientWidth;
        var currentHeight = Game.getDisplay().getContainer().clientHeight;

        var availableHeight = window.innerHeight;
        var availableWidth = window.innerWidth;

        var scaleX = availableWidth / currentWidth;
        var scaleY = availableHeight / currentHeight;
        // keep display proportions the same
        scaleX = Math.min(scaleX, scaleY);
        scaleY = scaleX;

        document.getElementById("game").style.width = currentWidth * scaleX + "px";
        document.getElementById("game").style.height = currentHeight * scaleY + "px";

        // reset screen offsets/cell dimensions so mouse is still accurate
        var elemRect = Game.getDisplay().getContainer().getBoundingClientRect();
        Game.setScreenOffsetX(elemRect.left);
        Game.setScreenOffsetY(elemRect.top);
        Game.setScreenCellWidth((elemRect.width) / Game.getScreenWidth());
        Game.setScreenCellHeight((elemRect.height) / Game.getScreenHeight());
    },
    refresh: function() {
        // Clear the screen
        this._display.clear();
        // Render the screen
        this._currentScreen.render(this._display);
    },
	getDisplay: function() {
		return this._display;
	},
    getScreenWidth: function() {
        return this._screenWidth;
    },
    getScreenHeight: function() {
        return this._screenHeight;
    },
    getMapWidth: function() {
        return this._mapWidth;
    },
    getMapHeight: function() {
        return this._mapHeight;
    },
    getMapOffsetX: function() {
        return this._mapOffsetX;
    },
    getMapOffsetY: function() {
        return this._mapOffsetY;
    },
    getScreenOffsetX: function() {
        return this._screenOffsetX;
    },
    getScreenOffsetY: function() {
        return this._screenOffsetY;
    },
    getScreenCellWidth: function() {
        return this._screenCellWidth;
    },
    getScreenCellHeight: function() {
        return this._screenCellHeight;
    },
    setScreenOffsetX: function(offset) {
        this._screenOffsetX = offset;
    },
    setScreenOffsetY: function(offset) {
        this._screenOffsetY = offset;
    },
    setScreenCellWidth: function(width) {
        this._screenCellWidth = width;
    },
    setScreenCellHeight: function(height) {
        this._screenCellHeight = height;
    },
    getInfoBarWidth: function() {
        return this._infoBarWidth;
    },
    getMessageHeight: function() {
        return this._messageHeight;
    },
    getUIWidth: function() {
        return this._uiWidth;
    },

	switchScreen: function(screen) {
	    // If we had a screen before, notify it that we exited
	    if (this._currentScreen !== null) {
	        this._currentScreen.exit();
	    }
	    // Clear the display
	    this.getDisplay().clear();
	    // Update our current screen, notify it we entered
	    // and then render it
	    this._currentScreen = screen;
	    if (this._currentScreen) {
	        this._currentScreen.enter();
	        this.refresh();
	    }
	}
};

window.onload = function() {
    // Initialize the game
    Game.init();
    // Add the containers to our HTML page
    document.body.appendChild(Game.getDisplay().getContainer());
    // Load the start screen
    Game.switchScreen(Game.Screen.startScreen);
};