const state = { init, preload, create, update };

const game = new Phaser.Game(400, 288, Phaser.AUTO, 'game', state);

let currentLevel = 1;
let levelsCount = 2;

let layers = {};

let coins;
let coinFrames = [];

let ennemies;
let ennemyFrames = [];

let door;
let doorFrames = [];

let mobSpeed = 20;

function init() {

Phaser.Canvas.setImageRenderingCrisp(game.canvas);
game.renderer.renderSession.roundPixels = true;
game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
game.scale.pageAlignHorizontally = true;
game.scale.pageAlignVertically = true;

}

function preload() {

  game.load.json('atlasFramesRecord', 'assets/sprites.json');
  game.load.atlas('atlas', 'assets/sprites.png', 'assets/sprites.json');
  game.load.tilemap(
    'level',
//    'assets/levels/level'+currentLevel+'.json',
    'assets/levels/level0.json',
    undefined,
    Phaser.Tilemap.TILED_JSON
  );
  game.load.image('tileset', 'assets/levels/tileset.png');

}

function create() {
  game.stage.backgroundColor = '#3b5998';
  game.physics.startSystem(Phaser.Physics.ARCADE);
  resetLocalCounters();
  createLevel();
  createEntities();
  createCountersDisplay();
  cursorKeys = game.input.keyboard.createCursorKeys();
  cursorKeys.up.onDown.add(handlePlayerJump);

}

function resetLocalCounters() {

  localCoinsCount = 0;
  localKillsCount = 0;
  killsToWin = 0;
  coinsToWin = 0;
  doorIsOpen = false;
  resetPlayerHealth();

}

function resetPlayerHealth(){
  if (currentHealth <= 0) {
    currentHealth = startingHealth;
  }
}

function createLevel() {

  map = game.add.tilemap('level');
  map.addTilesetImage('tileset');
  for (let layer of map.layers) {
    let name = layer.name;
    layers[name] = map.createLayer(name);
    map.setCollisionByExclusion([], true, layers[name]);
    if (name === 'hidden') {
      layers[name].alpha = 0;
    }
    if (name === 'jumpThrough') {
      layers[name].getTiles(
        layers[name].x, layers[name].y,
        layers[name].width, layers[name].height,
        true
      ).forEach(tile => {
        tile.setCollision(false, false, true, false);
      });
    }
  }

}

function createCoin(x, y) {

  let sprite = game.add.sprite(x, y, 'atlas', coinFrames[0]);
  sprite.anchor.set(.5);
  sprite.x += sprite.width / 2;
  sprite.y += sprite.height / 2;
  game.physics.arcade.enable(sprite);
  sprite.body.setSize(
    (sprite.width / 2) / sprite.scale.x,
    (sprite.height / 2) / sprite.scale.y,
    sprite.width / 4, sprite.height / 4
  );
  sprite.animations.add('spin', coinFrames, 8, true);
  sprite.animations.play('spin');
  return sprite;

}

function createEnnemy(x, y, props) {

  let sprite = game.add.sprite(x, y, 'atlas', ennemyFrames[0]);
  sprite.anchor.set(.5);
  sprite.x += sprite.width / 2;
  sprite.y += sprite.height / 2;
  game.physics.arcade.enable(sprite);
  sprite.body.setSize(
    (sprite.width / 2) / sprite.scale.x,
    (sprite.height / 2) / sprite.scale.y,
    sprite.width / 4, sprite.height / 4
  );
  sprite.body.velocity.x = mobSpeed;
  sprite.body.bounce.x = 1;
  sprite.animations.add('walk', ennemyFrames, 8, true);
  sprite.animations.play('walk');
  return sprite;

}

function createDoor(x, y, props) {

  let sprite = game.add.sprite(x, y, 'atlas', doorFrames[0]);
  game.physics.arcade.enable(sprite);
  sprite.body.immovable = true;
  sprite.animations.add('open', doorFrames);
  return sprite;

}

function getTileObjectProperties(props) {

  let o = {};
  for (let prop of props) {
    try {
      o[prop.name] = eval(prop.value);
    } catch (err) {
      o[prop.name] = prop.value;
    }
  }
  return o;

}

function createPlayer(x, y, props) {
  let sprite = game.add.sprite(x, y, 'atlas', playerIdleFrames[0]);
  sprite.anchor.set(.5);
  sprite.x += sprite.width / 2;
  sprite.y += sprite.height / 2;
  game.physics.arcade.enable(sprite);
  sprite.body.setSize(
    (sprite.width / 2) / sprite.scale.x,
    (sprite.height * 3 / 4) / sprite.scale.y,
    sprite.width / 4, sprite.height / 4
  );
  sprite.body.gravity.y = playerGravity;
  sprite._onLadder = false;
  sprite.health = currentHealth;
  sprite.animations.add('idle', playerIdleFrames, 2, true);
  sprite.animations.add('run', playerRunFrames, 2);
  sprite.animations.add('climb', playerClimbFrames, 2);
  sprite.animations.add('fall', playerFallFrames, 2);
  sprite.animations.add('jump', playerJumpFrames, 2);
  sprite.animations.play('idle');
  return sprite;
}

function createEntities() {

  setEntitiesAnimationFrames();
  coins = game.add.group();
  ennemies = game.add.group();
  coins.enableBody = true;
  ennemies.enableBody = true;
  for (let entity of map.objects.entities) {
    let entityName = entity.name;
    let entityProps = null;
    if (entity.properties) {
      entityProps = getTileObjectProperties(entity.properties);
    }
    if (entityName === 'coin') {
      coinsToWin++;
      coins.add(createCoin(entity.x, entity.y, entityProps));
    } else if (entityName === 'enemy') {
      killsToWin++;
      ennemies.add(createEnnemy(entity.x, entity.y, entityProps))
    } else if (entityName === 'door') {
      door = createDoor(entity.x, entity.y, entityProps);
    } else if (entityName === 'player') {
      player = createPlayer(entity.x, entity.y, entityProps);
    }
  }

}

function update() {

  game.physics.arcade.collide(ennemies, layers.hidden, flipX);
  updatePlayer();

}

function setEntitiesAnimationFrames() {

  atlasFramesRecord = game.cache.getJSON('atlasFramesRecord');
  for (let frameName of Object.keys(atlasFramesRecord.frames)) {
    if (/^run/.test(frameName)) playerRunFrames.push(frameName);
    if (/^idle/.test(frameName)) playerIdleFrames.push(frameName);
    if (/^climb/.test(frameName)) playerClimbFrames.push(frameName);
    if (/^fall/.test(frameName)) playerFallFrames.push(frameName);
    if (/^jump/.test(frameName)) playerJumpFrames.push(frameName);
    if (/^coin/.test(frameName)) coinFrames.push(frameName);
    if (/^walk/.test(frameName)) ennemyFrames.push(frameName);
    if (/^door/.test(frameName)) doorFrames.push(frameName);
  }

}

function flipX(sprite) {

  sprite.scale.x *= -1;

}
