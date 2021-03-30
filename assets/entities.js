// Player template
Game.PlayerTemplate = {
    name: 'Human (you)',
    character: '@',
    foreground: 'white',
    maxHp: 50,
    baseAttackValue: 3,
    attackDice: 6,
    sightRadius: 12,
    inventorySlots: 25,
    mixins: [Game.EntityMixins.PlayerActor, Game.EntityMixins.InventoryHolder,
             Game.EntityMixins.Attacker, Game.EntityMixins.Destructible,
             Game.EntityMixins.Sight, Game.EntityMixins.MessageRecipient,
             Game.EntityMixins.Equipper, Game.EntityMixins.Mover,
             Game.EntityMixins.ExperienceGainer, Game.EntityMixins.PlayerStatGainer]
};

Game.EntityRepository = new Game.Repository('entities', Game.Entity, Game.LevelEntityTables);

Game.EntityRepository.define('Rat', {
    name: 'Rat',
    character: 'r',
    foreground: 'rgb(200,100,100)',
    maxHp: 12,
    baseAttackValue: 1,
    attackDice: 2,
    speed: 1000,
    sightRadius: 10,
    inventorySlots: 0,
    minZLevel: 0,
    maxZLevel: 2,
    tasks: ['hunt', 'wander'],
    mixins: [Game.EntityMixins.TaskActor,
        Game.EntityMixins.Attacker, Game.EntityMixins.Destructible, 
        Game.EntityMixins.Sight, Game.EntityMixins.Mover,
        Game.EntityMixins.ExperienceGainer, Game.EntityMixins.RandomStatGainer]

});

Game.EntityRepository.define('Imp', {
    name: 'Imp',
    character: 'i',
    foreground: 'rgb(200,100,200)',
    maxHp: 12,
    baseAttackValue: 1,
    attackDice: 2,
    speed: 2000,
    sightRadius: 10,
    inventorySlots: 0,
    minZLevel: 0,
    maxZLevel: 2,
    tasks: ['hunt', 'wander'],
    mixins: [Game.EntityMixins.TaskActor,
             Game.EntityMixins.Attacker, Game.EntityMixins.Destructible, 
             Game.EntityMixins.Sight, Game.EntityMixins.Mover,
             Game.EntityMixins.ExperienceGainer, Game.EntityMixins.RandomStatGainer]
});

Game.EntityRepository.define('Greedy Ghost', {
    name: 'Greedy Ghost',
    character: 'g',
    foreground: 'rgb(100,200,200)',
    maxHp: 25,
    baseAttackValue: 2,
    attackDice: 4,
    speed: 1000,
    sightRadius: 10,
    inventorySlots: 1,
    minZLevel: 0,
    //maxZLevel: 5,
    tasks: ['huntItem', 'hunt', 'wander'],
    mixins: [Game.EntityMixins.TaskActor, Game.EntityMixins.InventoryHolder,
             Game.EntityMixins.Attacker, Game.EntityMixins.Destructible, 
             Game.EntityMixins.Sight, Game.EntityMixins.Mover,
             Game.EntityMixins.ExperienceGainer, Game.EntityMixins.RandomStatGainer]
});

Game.EntityRepository.define('Goblin', {
    name: 'Goblin',
    character: 'G',
    foreground: 'rgb(100,255,100)',
    maxHp: 30,
    baseAttackValue: 8,
    attackDice: 6,
    speed: 800,
    sightRadius: 5,
    minZLevel: 4,
    tasks: ['hunt', 'wander'],
    mixins: [Game.EntityMixins.TaskActor,
        Game.EntityMixins.Attacker, Game.EntityMixins.Destructible, 
        Game.EntityMixins.Sight, Game.EntityMixins.Mover,
        Game.EntityMixins.ExperienceGainer, Game.EntityMixins.RandomStatGainer]
});

Game.EntityRepository.define('Demon', {
    name: 'Demon',
    character: 'D',
    foreground: 'rgb(255,50,50)',
    maxHp: 50,
    baseAttackValue: 10,
    attackDice: 6,
    speed: 1000,
    sightRadius: 8,
    minZLevel: 10,
    tasks: ['hunt', 'wander'],
    mixins: [Game.EntityMixins.TaskActor,
        Game.EntityMixins.Attacker, Game.EntityMixins.Destructible, 
        Game.EntityMixins.Sight, Game.EntityMixins.Mover,
        Game.EntityMixins.ExperienceGainer, Game.EntityMixins.RandomStatGainer]
});

Game.EntityRepository.define('Ruler', {
    name: 'Ruler', 
    character: 'R',
    foreground: 'rgb(0,128,128)',
    maxHp: 80,
    attackValue: 25,
    attackDice: 6,
    defenseValue: 10,
    level: 5,
    sightRadius: 6,
    mixins: [Game.EntityMixins.RulerActor, Game.EntityMixins.Sight,
             Game.EntityMixins.Attacker, Game.EntityMixins.Destructible, Game.EntityMixins.Mover,
             Game.EntityMixins.ExperienceGainer, Game.EntityMixins.RandomStatGainer]
}, {
    disableRandomCreation: true
});

Game.EntityRepository.define('Slime', {
    name: 'Slime',
    character: 's',
    foreground: 'rgb(144,238,144)',
    maxHp: 10,
    attackValue: 5,
    sightRadius: 3,
    tasks: ['hunt', 'wander'],
    mixins: [Game.EntityMixins.TaskActor, Game.EntityMixins.Sight,
             Game.EntityMixins.Attacker, Game.EntityMixins.Destructible, Game.EntityMixins.Mover,
             Game.EntityMixins.ExperienceGainer, Game.EntityMixins.RandomStatGainer]
}, {
    disableRandomCreation: true
});

