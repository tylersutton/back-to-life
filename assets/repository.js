// A repository has a name and a constructor. The constructor is used to create
// items in the repository.
Game.Repository = function(name, ctor) {
    this._name = name;
    this._templates = {};
    this._ctor = ctor;
    this._randomTemplates = {};
    this._uniqueTemplates = {};
};

// Define a new named template.
Game.Repository.prototype.define = function(name, template, options) {
    this._templates[name] = template;
    // Apply any options
    var disableRandomCreation = options && options.disableRandomCreation;
    var uniqueCreation = options && options.enableUniqueCreation;
    if (!disableRandomCreation && !uniqueCreation) {
        this._randomTemplates[name] = template;
    } else if (uniqueCreation) {
        this._uniqueTemplates[name] = template;
    }
};


// Create an object based on a template.
Game.Repository.prototype.create = function(name, extraProperties) {
    if (!this._templates[name]) {
        throw new Error("No template named '" + name + "' in repository '" +
            this._name + "'");
    }
    // Copy the template
    var template = Object.create(this._templates[name]);
    // Apply any extra properties
    if (extraProperties) {
        for (var key in extraProperties) {
            template[key] = extraProperties[key];
        }
    }
    // Create the object, passing the template as an argument
    return new this._ctor(template);
};

// Create an object allowed at given z-level based on a random template
Game.Repository.prototype.createRandom = function(z, includedMixins, excludedMixins, arg) {
    // Pick a random key and create an object based off of it.
    var argRequired = arg !== undefined;
    var mixinsRequired = includedMixins !== undefined;
    var mixinsExcluded = excludedMixins !== undefined;
    z = z || 0;
    var validKeys = [];
    var i;
    for (var key in this._randomTemplates) {
        //console.log("template name: " + this._randomTemplates[key].name);
        if (this._randomTemplates[key].name) {
            var minZ = this._randomTemplates[key].minZLevel || 0;
            var maxZ = this._randomTemplates[key].maxZLevel || 1000;
            //console.log("name: " + this._randomTemplates[key].name + ", minZ: " + minZ + ", maxZ: " + maxZ);
            if (!mixinsRequired && !mixinsExcluded && 
                    z >= minZ && z <= maxZ && 
                    (!argRequired || this._randomTemplates[key][arg])) {
                validKeys.push(key);     
            } else {
                var valid = true;
                // key is invalid if z is outside bounds
                if (z < minZ || z > maxZ) {
                    //console.log("z outside bounds");
                    valid = false;
                }
                // key is invalid if missing arg
                if (argRequired && !this._randomTemplates[key][arg]) {
                    //console.log("did not match arg");
                    valid = false;
                }
                // key is invalid if none of the required mixins are present
                if (includedMixins) {
                    var found = false;
                    for (i = 0; i < includedMixins.length; i++) {
                        if (this._randomTemplates[key].mixins.includes(includedMixins[i])) {
                            found = true;
                        }
                    }
                    if (!found) {
                        //console.log("did not find required mixin");
                        valid = false;
                    }
                }
                // key is invalid if any excluded mixins are present
                if (excludedMixins) {
                    for (i = 0; i < excludedMixins.length; i++) {
                        if (this._randomTemplates[key].mixins.includes(excludedMixins[i])) {
                            //console.log("found excluded mixin");
                            valid = false;
                        }
                    }
                }
                if (valid) {
                    validKeys.push(key);
                } else {
                    //console.log("no valid candidates found");
                }
            }
        }
    }

    return this.create(validKeys[Math.floor(Math.random() * validKeys.length)]);
};