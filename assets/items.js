Game.ItemRepository = new Game.Repository('items', Game.Item);

Game.ItemRepository.define('soulVial', {
    name: 'soul vial',
    character: '!',
    foreground: 'rgb(210,210,100)',
    healValue: 20,
    isEmpty: false,
    mixins: [Game.ItemMixins.Healing]
});

// Weapons
Game.ItemRepository.define('dagger', {
    name: 'dagger',
    character: '|',
    foreground: 'gray',
    attackValue: 2,
    wieldable: true,
    maxZLevel: 3,
    mixins: [Game.ItemMixins.Equippable]
}, {
    //disableRandomCreation: true
});

Game.ItemRepository.define('stick', {
    name: 'stick',
    character: '/',
    foreground: 'rgb(130,100,50)',
    attackValue: 1,
    wieldable: true,
    maxZLevel: 1,
    mixins: [Game.ItemMixins.Equippable]
}, {
    //disableRandomCreation: true
});

Game.ItemRepository.define('ironSword', {
    name: 'iron sword',
    character: '|',
    foreground: 'rgb(175,175,175)',
    attackValue: 4,
    wieldable: true,
    minZLevel: 3,
    maxZLevel: 8,
    mixins: [Game.ItemMixins.Equippable]
}, {
    //disableRandomCreation: true
});

Game.ItemRepository.define('steelSword', {
    name: 'steel sword',
    character: '|',
    foreground: 'rgb(200,200,200)',
    attackValue: 7,
    wieldable: true,
    minZLevel: 8,
    maxZLevel: 15,
    mixins: [Game.ItemMixins.Equippable]
}, {
    //disableRandomCreation: true
});

Game.ItemRepository.define('steelLongSword', {
    name: 'steel longsword',
    character: '|',
    foreground: 'white',
    attackValue: 10,
    wieldable: true,
    minZLevel: 13,
    mixins: [Game.ItemMixins.Equippable]
}, {
    //disableRandomCreation: true
});

Game.ItemRepository.define('woodenStaff', {
    name: 'wooden staff',
    character: '_',
    foreground: 'yellow',
    attackValue: 1,
    defenseValue: 1,
    wieldable: true,
    maxZLevel: 3,
    mixins: [Game.ItemMixins.Equippable]
}, {
    //disableRandomCreation: true
});

Game.ItemRepository.define('ironStaff', {
    name: 'wooden staff',
    character: '_',
    foreground: 'yellow',
    attackValue: 3,
    defenseValue: 1,
    wieldable: true,
    minZLevel: 3,
    maxZLevel: 8,
    mixins: [Game.ItemMixins.Equippable]
}, {
    //disableRandomCreation: true
});

Game.ItemRepository.define('steelStaff', {
    name: 'wooden staff',
    character: '_',
    foreground: 'yellow',
    attackValue: 5,
    defenseValue: 2,
    wieldable: true,
    minZLevel: 8,
    maxZLevel: 15,
    mixins: [Game.ItemMixins.Equippable]
}, {
    //disableRandomCreation: true
});

// Wearables
Game.ItemRepository.define('tunic', {
    name: 'tunic',
    character: '(',
    foreground: 'green',
    defenseValue: 2,
    wearable: true,
    maxZLevel: 2,
    mixins: [Game.ItemMixins.Equippable]
}, {
    //disableRandomCreation: true
});

// Wearables
Game.ItemRepository.define('leather robe', {
    name: 'leather robe',
    character: '(',
    foreground: 'rgb(158,116,43)',
    defenseValue: 3,
    wearable: true,
    maxZLevel: 3,
    mixins: [Game.ItemMixins.Equippable]
}, {
    //disableRandomCreation: true
});

Game.ItemRepository.define('chainmail', {
    name: 'chainmail',
    character: '[',
    foreground: 'aliceblue',
    defenseValue: 4,
    minZLevel: 2,
    maxZLevel: 6,
    wearable: true,
    mixins: [Game.ItemMixins.Equippable]
}, {
    //disableRandomCreation: true
});

Game.ItemRepository.define('ironPlatemail', {
    name: 'iron platemail',
    character: '[',
    foreground: 'rgb(200,200,200)',
    defenseValue: 6,
    minZLevel: 5,
    maxZLevel: 13,
    wearable: true,
    mixins: [Game.ItemMixins.Equippable]
}, {
   // disableRandomCreation: true
});

Game.ItemRepository.define('steelPlatemail', {
    name: 'steel platemail',
    character: '[',
    foreground: 'white',
    defenseValue: 10,
    minZLevel: 12,
    wearable: true,
    mixins: [Game.ItemMixins.Equippable]
}, {
   // disableRandomCreation: true
});
