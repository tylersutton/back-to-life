Object.prototype.extend = function(a) {
    this.prototype=Object.create(a.prototype);
    this.prototype.constructor = this;
    return this;
    };

var Game = {
	_display: null,
    _uiDisplay: null,
    _titleDisplay: null,
	_currentScreen: null,
	_screenWidth: 30,
    _screenHeight: 20,
    _fontSize: 24,
    _menuScreenWidth: 50,
    _uiWidth: 60,
    _uiHeight: 8,
    _uiFontSize: 21,

    init: function() {
	    // Any necessary initialization will go here.
	    var options = {
            width: this._screenWidth,
            height: this._screenHeight,
            fontSize: this._fontSize,
            bg: "rgb(20,20,20)",
            forceSquareRatio: true,
            fontFamily: "Consolas, monospace"
        }
        this._display = new ROT.Display(options);
        this._display.getContainer().setAttribute('id', "game");
        var uiOptions = {
            width: this._uiWidth,
            height: this._uiHeight,
            fontSize: this._uiFontSize,
            bg: "rgb(20,20,20)",
            fontFamily: "Consolas, monospace"
        }
        this._uiDisplay = new ROT.Display(uiOptions);
        this._uiDisplay.getContainer().setAttribute('id', 'ui');
        var titleOptions = {
            width: 40,
            height: 1,
            fontSize: 31,
            bg: "rgb(20,20,20)",
            fontFamily: "Consolas, monospace"
        }
        this._titleDisplay = new ROT.Display(titleOptions);
        this._titleDisplay.getContainer().setAttribute('id', 'title');
        //document.querySelector("figure").appendChild(this._display.getContainer());
	    // Create a helper function for binding to an event
	    // and making it send it to the screen
        var game = this; // So that we don't lose this
	    var bindEventToScreen = function(event) {
	        window.addEventListener(event, function(e) {
	            // When an event is received, send it to the
	            // screen if there is one
	            if (game._currentScreen !== null) {
	                // Send the event type and data to the screen
	                game._currentScreen.handleInput(event, e);
                    
	            }
	        });
	    }
	    // Bind keyboard input events
	    bindEventToScreen('keydown');
	    bindEventToScreen('keyup');
	    bindEventToScreen('keypress');
        bindEventToScreen('click');
        bindEventToScreen('mousemove');
	},
    refresh: function() {
        // Clear the screen
        this._display.clear();
        // Clear the UI
        this._uiDisplay.clear();
        // Render the screen
        this._currentScreen.render(this._display, this._uiDisplay);
    },
	getDisplay: function() {
		return this._display;
	},
    getUIDisplay: function() {
        return this._uiDisplay;
    },
    getTitleDisplay: function() {
        return this._titleDisplay;
    },
    getScreenWidth: function() {
        return this._screenWidth;
    },
    getScreenHeight: function() {
        return this._screenHeight;
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
	    if (!this._currentScreen !== null) {
	        this._currentScreen.enter();
	        this.refresh();
	    }
	}
}

window.onload = function() {
    // Initialize the game
    Game.init();
    // Add the containers to our HTML page
    document.body.appendChild(Game.getTitleDisplay().getContainer());
    document.body.appendChild(Game.getDisplay().getContainer());
    document.body.appendChild(Game.getUIDisplay().getContainer());
    // Load the start screen
    Game.switchScreen(Game.Screen.startScreen);
}