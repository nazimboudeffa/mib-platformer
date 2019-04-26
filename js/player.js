let player;
let playerRunFrames = [];
let playerIdleFrames = [];
let playerClimbFrames = [];
let playerFallFrames = [];
let playerJumpFrames = [];

let playerSpeed = 80;
let playerJumpSpeed = -140;
let playerClimbSpeed = 40;
let playerGravity = 300;
let playerMobBounce = 90;
let playerSuperArmor = false;
let playerSuperArmorCoolDown = 0
let playerSuperArmorDelay = 600;
let playerBlinkRate = 80;
let playerBlinkTime = 0;

let startingHealth = 3;
let currentHealth = 3;
let totalCoinsCount = 0;
let totalKillsCount = 0;
let localCoinsCount = 0;
let localKillsCount = 0;
let killsToWin = 0;
let coinsToWin = 0;
let doorIsOpen = false;

function createCountersDisplay() {
  createCoinsCounterDisplay();
  createHealthDisplay();
}

function createCoinsCounterDisplay() {
  coinsCountDisplayGroup = game.add.group(undefined, 'coinsCountDisplayGroup');
  coinsCountIcon = game.add.sprite(0, 0, 'atlas', coinFrames[0]);
  coinsCountText = game.add.text(map.tileWidth, 0, 'x ' + totalCoinsCount, {
    fill: 'white',
    font: '12px arial'
  });
  coinsCountDisplayGroup.add(coinsCountIcon)
  coinsCountDisplayGroup.add(coinsCountText);
}

function createHealthDisplay() {
  playerHealthDisplay = game.add.group(undefined, 'playerHealthDisplayGroup');
  for (let i = 0; i < player.health; i++) {
    let x = i * map.tileWidth + i;
    let healthSprite = game.add.sprite(x, 0, 'atlas', 'firstaid.png');
    //healthSprite.scale.set(0.5);
    playerHealthDisplay.add(healthSprite);
  }
  playerHealthDisplay.x = map.tileWidth * 1.2;
  playerHealthDisplay.y = map.tileHeight * 1.2;
}

function updateCountersDisplay() {
  updateCoinsCounterDisplay();
  updateHealthDisplay();
}

function updateCoinsCounterDisplay() {
  coinsCountText.text = 'x ' + totalCoinsCount;
  coinsCountDisplayGroup.x = game.world.width - (map.tileWidth * 1.2 + coinsCountIcon.width + coinsCountText.width);
  coinsCountDisplayGroup.y = map.tileHeight;
}

function updateHealthDisplay() {
  if (player.health < playerHealthDisplay.children.length) {
    playerHealthDisplay.removeChildAt(playerHealthDisplay.children.length - 1);
  }
}

function handlePlayerWasHit() {
  if (playerSuperArmor) {
    if (Date.now() >= playerSuperArmorCoolDown) {
      playerSuperArmor = false;
    }
    if (Date.now() >= playerBlinkTime) {
      player.alpha = player.alpha ? 0 : 1;
      playerBlinkTime = Date.now() + playerBlinkRate;
    }
  } else {
    player.alpha = 1;
  }
}

function updatePlayer(){

  updateCountersDisplay();
  handleWin();
  handlePlayerWasHit();
  handleFail();

  game.physics.arcade.collide(player, layers.ground);
  game.physics.arcade.collide(player, layers.jumpThrough, undefined, jumpThrough);
  game.physics.arcade.overlap(player, coins, collectCoin);
  game.physics.arcade.overlap(player, ennemies, onPlayerVsMobs);
  game.physics.arcade.collide(player, door, goToNextLevel)

  if (!player._onLadder) {
  handlePlayerMovements();
}

function collectCoin(sprite, coin) {
  incrementCoinsCounters();
  coin.destroy();
}

function onPlayerVsMobs(player, mob) {
  if (player.body.touching.down) {
    incrementKillsCounters();
    player.body.velocity.y = -playerMobBounce;
    mob.destroy();
  } else {
    if (!playerSuperArmor) {
      player.health--;
      currentHealth = player.health;
      playerSuperArmor = true;
      playerSuperArmorCoolDown = Date.now() + playerSuperArmorDelay;
    }
  }
}

function incrementCoinsCounters() {
  localCoinsCount++;
  totalCoinsCount++;
}

function incrementKillsCounters() {
  localKillsCount++;
  totalKillsCount++;
}

function handlePlayerMovements() {

  if (cursorKeys.right.isDown) {
    player.scale.x *= player.scale.x < 0 ? -1 : 1;
    player.body.velocity.x = playerSpeed;
  } else if (cursorKeys.left.isDown) {
    player.scale.x *= player.scale.x > 0 ? -1 : 1;
    player.body.velocity.x = -playerSpeed;
  } else {
    player.body.velocity.x = 0;
  }

  if (player.body.velocity.x && player.body.blocked.down) {
    player.animations.play('run');
  } else if (!player.body.velocity.x && player.body.blocked.down) {
    player.animations.play('idle')
  }

  if (player.body.velocity.y > 0) {
    player.animations.play('fall');
  } else if (player.body.velocity.y < 0) {
    player.animations.play('jump')
  }
}

}

function jumpThrough(sprite, tile) {
  if (sprite.world.y < tile.worldY) {
    return true;
  }
  return false;
}

function handlePlayerJump() {
  if (cursorKeys.up.isDown && player.body.blocked.down) {
    player.body.velocity.y = playerJumpSpeed;
  }
}

function handleWin() {
  if (
    localCoinsCount === coinsToWin
    && localKillsCount === killsToWin
    && !doorIsOpen
  ) {
    doorIsOpen = true;
    door.frameName = doorFrames[1];
  }
}

function handleFail() {
  if (player.health <= 0) {
    game.state.restart();
  }
}

function goToNextLevel(player, door) {
  if (doorIsOpen) {
    console.log("Ready for next level");
    //currentLevel++;
    if (currentLevel > levelsCount) {
    //  currentLevel = 1;
    console.log("You win");
    }
    game.state.restart();
  }
}
