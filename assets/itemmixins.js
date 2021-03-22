Game.ItemMixins = {};

Game.ItemMixins.Healing = {
    name: 'Healing',
    init: function(template) {
        this._healValue = template['healValue'] || 1;
        this._isEmpty = template['isEmpty'] || false;
        this._canQuickHeal = template['canQuickHeal'] || false;
    },
    consume: function(entity) {
        if (entity.hasMixin('Destructible')) {
            if (!this._isEmpty) {
                entity.heal(this._healValue);
                //this._isEmpty = true;
            }
            else {
                Game.sendMessage(entity, "It has no effect.");
            } 
        }
    },
    canQuickHeal: function() {
        return this._canQuickHeal;
    },
    isEmpty: function() {
        return this._isEmpty;
    },
    empty: function() {
        this._isEmpty = true;
    },
    describe: function(plural) {
        if (this._isEmpty) {
            return 'empty ' + Game.Item.prototype.describe.call(this);
        } else {
            if (plural) {
                return this._pluralName;
            } else {
                return this._name;
            }
        }
    },
    listeners: {
        'details': function() {
            return [{key: 'healing', value: this._healValue}];
        }
    }
}

Game.ItemMixins.Equippable = {
    name: 'Equippable',
    init: function(template) {
        this._attackValue = template['attackValue'] || 0;
        this._defenseValue = template['defenseValue'] || 0;
        this._wieldable = template['wieldable'] || false;
        this._wearable = template['wearable'] || false;
        this._ranged = template['ranged'] || false;
    },
    getAttackValue: function() {
        return this._attackValue;
    },
    getDefenseValue: function() {
        return this._defenseValue;
    },
    isWieldable: function() {
        return this._wieldable;
    },
    isWearable: function() {
        return this._wearable;
    },
    isRanged: function() {
        return this._ranged;
    },
    getAttackDefense: function() {
        var attack = this.getAttackValue();
        var defense = this.getDefenseValue();
        var suffix = '';
        if (attack + defense > 0) {
            suffix += ' +' + attack + ',+' + defense;
        } 
        return suffix;
    },
    listeners: {
        'details': function() {
            var results = [];
            if (this._wieldable) {
                results.push({key: 'atk', value: '+' + this.getAttackValue()});
            }
            if (this._wearable) {
                results.push({key: 'def', value: '+' + this.getDefenseValue()});
            }
            return results;
        }
    }
};

Game.ItemMixins.Scroll = {
    name: 'Scroll',
    init: function(template) {
        this._identified = true; //template['identified'] || false;
    },
    identify: function() {
        this._identified = true;
    },
    describe: function(plural) {
        if (this._identified) {
            if (plural) {
                return this._pluralName;
            } else {
                return this._name;
            }
            
        } else {
            if (plural) {
                return 'mysterious scrolls';
            } else {
                return 'mysterious scroll';
            }
        }
    }
}

Game.ItemMixins.Paralysis = {
    name: 'Paralysis',
    init: function(template) {
        this._paralysisDuration = template['paralysisDuration'] || 5;
    },
    listeners: {
        'details': function() {
            return [{key: 'duration', value: this._paralysisDuration}];
        }
    },
    getParalysisDuration: function() {
        return this._paralysisDuration;
    }
}