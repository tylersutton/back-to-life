Game.ItemRepository = new Game.Repository('items', Game.Item, Game.LevelItemTables);

//#region Healing Items
Game.ItemRepository.define('soulVial', {
    name: 'soul vial',
    character: '!',
    foreground: 'rgb(210,210,100)',
    healValue: 20,
    canQuickHeal: true,
    isEmpty: false,
    mixins: [Game.ItemMixins.Healing]
});
//#endregion

//#region Ranged Weapons
Game.ItemRepository.define('shortbow', {
    name: 'shortbow',
    character: '}',
    foreground: 'rgb(130,100,50)',
    attackValue: 2,
    wieldable: true,
    ranged: true,
    mixins: [Game.ItemMixins.Equippable]
});
// #endregion

//#region Melee Weapons
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

Game.ItemRepository.define('axe', {
    name: 'axe',
    character: '\\',
    foreground: 'rgb(175,175,175)',
    attackValue: 2,
    wieldable: true,
    circleAttack: true,
    maxZLevel: 4,
    mixins: [Game.ItemMixins.Equippable]
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
    name: 'iron staff',
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
    name: 'steel staff',
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
//#endregion

//#region Wearables
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
Game.ItemRepository.define('leatherRobe', {
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
    pluralName: 'chainmail',
    character: '[',
    foreground: 'rgb(200,200,200)',
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
    pluralName: 'iron platemail',
    character: '[',
    foreground: 'aliceblue',
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
    pluralName: 'steel platemail',
    character: '[',
    foreground: 'white',
    defenseValue: 10,
    minZLevel: 12,
    wearable: true,
    mixins: [Game.ItemMixins.Equippable]
}, {
   // disableRandomCreation: true
});
//#endregion

//#region Scrolls
Game.ItemRepository.define('scrollOfParalysis', {
    name: 'scroll of paralysis',
    pluralName: 'scrolls of paralysis',
    character: '???',
    foreground: 'rgb(210,210,100)',
    paralysisDuration: 5,
    mixins: [Game.ItemMixins.Scroll, Game.ItemMixins.Paralysis]
}, {
    
});
//#endregion