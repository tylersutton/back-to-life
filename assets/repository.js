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
    var disableRandomCreation = options && options['disableRandomCreation'];
    var uniqueCreation = options && options['enableUniqueCreation'];
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
Game.Repository.prototype.createRandom = function(z, mixin, arg) {
    // Pick a random key and create an object based off of it.
    var argRequired = arg !== undefined;
    var mixinRequired = mixin !== undefined;
    z = z || 0;
    var validKeys = [];
    for (var key in this._randomTemplates) {
        //console.log("template name: " + this._randomTemplates[key].name);
        if (this._randomTemplates[key].name) {
            var minZ = this._randomTemplates[key]['minZLevel'] || 0;
            var maxZ = this._randomTemplates[key]['maxZLevel'] || 1000;
            //console.log("name: " + this._randomTemplates[key].name + ", minZ: " + minZ + ", maxZ: " + maxZ);
            if (z >= minZ && z <= maxZ 
                    && (!mixinRequired || this._randomTemplates[key]['mixins'].includes(mixin))
                    && (!argRequired || this._randomTemplates[key][arg])) {
                //console.log("name: " + this._randomTemplates[key].name);
                validKeys.push(key);
            }
        }
    }

    return this.create(validKeys[Math.floor(Math.random() * validKeys.length)]);
};