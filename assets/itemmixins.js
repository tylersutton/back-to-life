Game.ItemMixins = {};

Game.ItemMixins.Healing = {
    name: 'Healing',
    init: function(template) {
        this._healValue = template['healValue'] || 1;
        this._isEmpty = template['isEmpty'] || false;
    },
    consume: function(entity) {
        if (entity.hasMixin('Destructible')) {
            if (!this._isEmpty) {
                entity.heal(this._healValue);
                this._isEmpty = true;
            }
            else {
                Game.sendMessage(entity, "It has no effect.");
            } 
        }
    },
    isEmpty: function() {
        return this._isEmpty;
    },
    empty: function() {
        this._isEmpty = true;
    },
    describe: function() {
        if (this._isEmpty) {
            return 'empty ' + Game.Item.prototype.describe.call(this);
        } else {
            return this._name;
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
    getSuffix: function() {
        var attack = this.getAttackValue();
        var defense = this.getDefenseValue();
        var suffix = '';
        if (attack > 0) {
            suffix += ' {+' + attack;
            if (defense > 0) {
                suffix += " atk, +" + defense + " def}";
            } else {
                suffix += " atk}";
            }
        } else if (defense > 0) {
            suffix += ' {+' + defense + " def}";
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