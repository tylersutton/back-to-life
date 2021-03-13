Game.DynamicGlyph = function(properties) {
    properties = properties || {};
    // Call the glyph's construtor with our set of properties
    Game.Glyph.call(this, properties);
    // Instantiate any properties from the passed object
    this._name = properties['name'] || '';
    // Create an object which will keep track what mixins we have
    // attached to this entity based on the name property
    this._attachedMixins = {};
    // Create a similar object for groups
    this._attachedMixinGroups = {};
    // Set up an object for listeners
    this._listeners = {};
    // Setup the object's mixins
    var mixins = properties['mixins'] || [];
    for (var i = 0; i < mixins.length; i++) {
        // Copy over all properties from each mixin as long
        // as it's not the name, init, or listeners property. We
        // also make sure not to override a property that
        // already exists on the entity.
        for (var key in mixins[i]) {
            if (key != 'init' && key != 'name' && key != 'listeners' 
                && !this.hasOwnProperty(key)) {
                this[key] = mixins[i][key];
            }
        }
        // Add the name of this mixin to our attached mixins
        this._attachedMixins[mixins[i].name] = true;
        // If a group name is present, add it
        if (mixins[i].groupName) {
            this._attachedMixinGroups[mixins[i].groupName] = true;
        }
        // Add all of our listeners
        if (mixins[i].listeners) {
            for (var key in mixins[i].listeners) {
                // If we don't already have a key for this event in our listeners
                // array, add it.
                //console.log("mixin name:" + mixins[i].name);
                // Add the listener, IF we don't already know about it
                if (!this._listeners[key]) {
                    this._listeners[key] = [];
                } else if (typeof(this._listeners[key]) === 'function') {
                    this._listeners[key] = [];
                }
                //console.log("this._listeners[key]: " + this._listeners[key]);
                if (this._listeners[key].indexOf(mixins[i].listeners[key]) === -1) {
                    this._listeners[key].push(mixins[i].listeners[key]);
                }
            }
        }
        // Finally call the init function if there is one
        if (mixins[i].init) {
            mixins[i].init.call(this, properties);
        }
    }
};

// Make dynamic glyphs inherit all the functionality from glyphs
Game.DynamicGlyph.extend(Game.Glyph);

Game.DynamicGlyph.prototype.hasMixin = function(obj) {
    // Allow passing the mixin itself or the name / group name as a string
    if (typeof obj === 'object') {
        return this._attachedMixins[obj.name];
    } else {
        return this._attachedMixins[obj] || this._attachedMixinGroups[obj];
    }
};

Game.DynamicGlyph.prototype.setName = function(name) {
    this._name = name;
};

Game.DynamicGlyph.prototype.getName = function() {
    return this._name;
};

Game.DynamicGlyph.prototype.describe = function() {
    return this._name;
};
Game.DynamicGlyph.prototype.getDetails = function() {
    var details = '';
    var detailGroups = this.raiseEvent('details');
    // Iterate through each return value, grabbing the details from the arrays.
    if (detailGroups) {
        for (var i = 0; i < detailGroups.length; i++) {
            if (detailGroups[i]) {
                for (var j = 0; j < detailGroups[i].length; j++) {
                    details += detailGroups[i][j].key + ': ' +  detailGroups[i][j].value;
                    //console.log("details: " + details);
                    if (j < detailGroups[i].length - 1) {
                        details += ", ";
                    }  
                }
            } else {
                details += detailGroups[i].key + ': ' +  detailGroups[i].value;
            }
            if (i < detailGroups.length - 1) {
                details += ", ";
            }
        }
    }

    return details;
};

Game.DynamicGlyph.prototype.describeA = function(capitalize) {
    // Optional parameter to capitalize the a/an.
    var prefixes = capitalize ? ['A', 'An'] : ['a', 'an'];
    var string = this.describe();
    var firstLetter = string.charAt(0).toLowerCase();
    // If word starts by a vowel, use an, else use a. Note that this is not perfect.
    var prefix = 'aeiou'.indexOf(firstLetter) >= 0 ? 1 : 0;

    return prefixes[prefix] + ' ' + string;
};
Game.DynamicGlyph.prototype.describeThe = function(capitalize) {
    var prefix = capitalize ? 'The' : 'the';
    return prefix + ' ' + this.describe();
};

Game.DynamicGlyph.prototype.raiseEvent = function(event) {
    //console.log("raising event: " + event);
    // Make sure we have at least one listener, or else exit
    if (!this._listeners[event]) {
        return;
    }
    // Extract any arguments passed, removing the event name
    var args = Array.prototype.slice.call(arguments, 1)
    // Invoke each listener, with this entity as the context and the arguments
    var results = [];
    for (var i = 0; i < this._listeners[event].length; i++) {
        results.push(this._listeners[event][i].apply(this, args));
    }
    return results;
};