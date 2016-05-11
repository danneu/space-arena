
var Game = require('./common/Game');
var Player =require('./common/Player'); 
var Vector = require('./common/Vector');
var Bomb = require('./common/Bomb');
var Bullet = require('./common/Bullet');
var belt = require('./common/belt');

// var SERVER_URL = 'https://hello-world-game.herokuapp.com/';
var SERVER_URL;
if (window.location.hostname === 'localhost') {
  SERVER_URL = 'http://localhost:3000'
} else {
  SERVER_URL = 'http://space-arena.herokuapp.com'
}

// client.js

var localGame = new Game();
var localPlayerId;

var windowDims = { w: window.innerWidth, h: window.innerHeight };


// SETUP PIXI

var viewport = new PIXI.Container();

var renderer = PIXI.autoDetectRenderer(windowDims.w, windowDims.h);
console.log('renderer:', renderer);
document.body.appendChild(renderer.view);

var world = new PIXI.Container();
var shipTexture = PIXI.Texture.fromImage('/img/ship.gif');
var bombTexture = PIXI.Texture.fromImage('/img/bomb.png');
var bulletTexture = PIXI.Texture.fromImage('/img/bullet.png');
var wallTexture = PIXI.Texture.fromImage('/img/asteroid16.jpg');
var starfieldSprite = new PIXI.extras.TilingSprite(PIXI.Texture.fromImage('/img/starfield.jpg'), renderer.width, renderer.height);
var info = new PIXI.Text('loading...', {
  font: '18px monospace',
  fill: 0xffffff
});

viewport.addChild(starfieldSprite);
viewport.addChild(info);
viewport.addChild(world);

// Add walls to world
for (var rowIdx in localGame.level.raw) {
  var row = localGame.level.raw[rowIdx];
  for (var colIdx in row) {
    var cell = row[colIdx];
    if (cell === '0') continue;
    var sprite = new PIXI.Sprite(wallTexture);
    var x = (rowIdx) * localGame.level.tilesize;
    var y = (colIdx) * localGame.level.tilesize;
    sprite.position.set(y, x);
    world.addChild(sprite);
  }
}


// our own mapping of playerIds to their underlying PIXI Sprite instance
// gets updated as players join/leave
var sprites = Object.create(null);

// creates a sprite from a player, adds it to the
// global `sprites` map, and adds it to the stage
function addPlayerSprite (player) {
  var sprite = new PIXI.Sprite(shipTexture);
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
  sprite.position.x = player.pos.x;
  sprite.position.y = player.pos.y;
  sprite.rotation = belt.degToRad(player.angle);
  sprites[player.id] = sprite;
  world.addChild(sprite);
}
function addBombSprite (state) {
  var sprite = new PIXI.Sprite(bombTexture);
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
  sprite.position.x = state.pos.x;
  sprite.position.y = state.pos.y;
  sprites[state.id] = sprite;
  world.addChild(sprite);
}

function addBulletSprite (state) {
  var sprite = new PIXI.Sprite(bulletTexture);
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
  sprite.position.x = state.pos.x;
  sprite.position.y = state.pos.y;
  sprites[state.id] = sprite;
  world.addChild(sprite);
}

function removeSprite (id) {
  world.removeChild(sprites[id]);
  delete sprites[id];
}

////////////////////////////////////////////////////////////

function getInfoText () {
  if (!localPlayerId) return '';
  var player = localGame.players[localPlayerId];
  var out = '';
  out += ' speed: ' + player.vel.length().toFixed(2);
  out += '\n nose : (' + player.nose().x.toFixed(2) + ', ' + player.nose().y.toFixed(2) + ')';
  out += '\n posit: (' + player.pos.x.toFixed(2) + ', ' + player.pos.y.toFixed(2) + ')';
  out += '\n accel: (' + player.acc.x.toFixed(2) + ', ' + player.acc.y.toFixed(2) + ')';
  out += '\n veloc: (' + player.vel.x.toFixed(2) + ', ' + player.vel.y.toFixed(2) + ')';
  out += '\n facing: ' + Math.floor(player.angle) + '°';
  out += '\n moving: ' + Math.floor(player.vel.deg()) + '°';
  out += '\n ----';
  out += '\n energy: ' + player.currEnergy + '/' + player.totalEnergy;
  return out;
}

function animate () {
  requestAnimationFrame(animate);
  if (localPlayerId) {
    var localPlayer = localGame.players[localPlayerId];
    // info text
    info.text = getInfoText();
    // parallel
    starfieldSprite.tilePosition.x += -localPlayer.vel.x/2;
    starfieldSprite.tilePosition.y += -localPlayer.vel.y/2;
    // center cam
    world.position.x = windowDims.w/2 - localPlayer.pos.x;
    world.position.y = windowDims.h/2 - localPlayer.pos.y;
  }
  renderer.render(viewport);
}
animate();

// CONNECT TO SERVER

var socket = io(SERVER_URL);

socket.on('connect', onConnect);

function onConnect () {
  socket.emit('HANDSHAKE', onHandshake);
  socket.on('GAME_STATE', onGameState);
  socket.on('PLAYER_JOIN', onPlayerJoin);
  socket.on('PLAYER_LEAVE', onPlayerLeave);
}

function onPlayerJoin (player) {
  console.log('PLAYER_JOIN', player);
  addPlayerSprite(player);
}

function onPlayerLeave (player) {
  console.log('PLAYER_LEAVE', player);
  removeSprite(player.id);
}

function onGameState (state) {
  // merge in player state from server or create them locally
  for (var id in state.players) {
    if (localGame.players[id])
      localGame.players[id].mergeM(state.players[id]);
    else
      localGame.players[id] = new Player(state.players[id]);
  }
  // merge in bomb state from server or create them locally
  for (var id in state.bombs) {
    if (localGame.bombs[id])
      localGame.bombs[id].mergeM(state.bombs[id]);
    else
      localGame.bombs[id] = new Bomb(state.bombs[id]);
  }
  // merge in bullet state from server or create them locally
  for (var id in state.bullets) {
    if (localGame.bullets[id])
      localGame.bullets[id].mergeM(state.bullets[id]);
    else
      localGame.bullets[id] = new Bullet(state.bullets[id]);
  }
  // update each player sprite
  for (var id in localGame.players) {
    if (sprites[id]) {
      sprites[id].rotation = belt.degToRad(localGame.players[id].angle);
      sprites[id].position.x = localGame.players[id].pos.x;
      sprites[id].position.y = localGame.players[id].pos.y;
    } else {
      addPlayerSprite(localGame.players[id]);
    }
  }
  // update each bomb sprite
  for (var id in localGame.bombs) {
    if (sprites[id]) {
      sprites[id].position.x = localGame.bombs[id].pos.x;
      sprites[id].position.y = localGame.bombs[id].pos.y;
    } else {
      addBombSprite(localGame.bombs[id]);
    }
  }
  // update each bullet sprite
  for (var id in localGame.bullets) {
    if (sprites[id]) {
      sprites[id].position.x = localGame.bullets[id].pos.x;
      sprites[id].position.y = localGame.bullets[id].pos.y;
    } else {
      addBulletSprite(localGame.bullets[id]);
    }
  }
  // remove local players that don't exist anymore
  for (var id in localGame.players) {
    if (!state.players[id]) {
      removeSprite(id);
    }
  }
  // remove local bombs that don't exist anymore
  for (var id in localGame.bombs) {
    if (!state.bombs[id]) {
      removeSprite(id);
    }
  }
  // remove local bullets that don't exist anymore
  for (var id in localGame.bullets) {
    if (!state.bullets[id]) {
      removeSprite(id);
    }
  }
}

function onHandshake (id) {
  console.log('[onHandshake] id:', id);
  localPlayerId = id;
  console.log('initialized as localPlayer', localGame.getPlayer(localPlayerId));
  //beginPingLoop();
}

var keyToCode = {
  W: 87, A: 65, S: 83, D: 68,
  UP: 38, LEFT: 37, DOWN: 40, RIGHT: 39
};
var codeToKey = {
  87: 'W', 65: 'A', 83: 'S', 68: 'D',
  38: 'UP', 37: 'LEFT', 40: 'DOWN', 39: 'RIGHT'
};

document.addEventListener('keydown', function (e) {
  if (!codeToKey[e.keyCode]) return;
  // do nothing if we're already holding it down
  if (localGame.getPlayer(localPlayerId).keys[codeToKey[e.keyCode]]) return;
  localGame.getPlayer(localPlayerId).keys[codeToKey[e.keyCode]] = true;
  socket.emit('KEYDOWN', codeToKey[e.keyCode]);
});

document.addEventListener('keyup', function (e) {
  if (!codeToKey[e.keyCode]) return;
  socket.emit('KEYUP', codeToKey[e.keyCode]);
  localGame.getPlayer(localPlayerId).keys[codeToKey[e.keyCode]] = false;
});

function beginPingLoop () {
  var lastPing = new Date(0);
  function ping () {
    // hack to avoid catchup socket-spam when refocusing window
    if (new Date() - lastPing < 1000) return;
    var start = Date.now();
    socket.emit('PING', function () {
      var diff = Date.now() - start;
      lastPing = new Date();
      console.log('Ping: ' + diff + 'ms');
    });
  }
  setInterval(ping, 1000);
}
