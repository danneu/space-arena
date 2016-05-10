
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

// SETUP PIXI

var renderer = PIXI.autoDetectRenderer(localGame.w, localGame.h);
console.log('renderer:', renderer);
document.body.appendChild(renderer.view);

var stage = new PIXI.Container();
var shipTexture = PIXI.Texture.fromImage('/img/ship.gif');
var bombTexture = PIXI.Texture.fromImage('/img/bomb.png');
stage.addChild(new PIXI.extras.TilingSprite(PIXI.Texture.fromImage('/img/starfield.jpg'), renderer.width, renderer.height));
var info = new PIXI.Text('test', {
  font: '18px monospace',
  fill: 0xffffff
});
stage.addChild(info);

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
  sprite.rotation = degToRad(player.angle);
  sprites[player.id] = sprite;
  stage.addChild(sprite);
}
function addBombSprite (state) {
  var sprite = new PIXI.Sprite(bombTexture);
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
  sprite.position.x = state.pos.x;
  sprite.position.y = state.pos.y;
  sprites[state.id] = sprite;
  stage.addChild(sprite);
}

function removePlayerSprite (player) {
  stage.addChild(sprites[player.id]);
  delete sprites[player.id];
}
function removeBombSprite (state) {
  stage.addChild(sprites[state.id]);
  delete sprites[state.id];
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
  return out;
}

function animate () {
  requestAnimationFrame(animate);
  info.text = getInfoText();
  renderer.render(stage);
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
  removePlayerSprite(player);
}

function onGameState (state) {
  // OFF: localGame.mergeState(state);

  // merge in player state from server or create them locally
  for (var id in state.players) {
    if (localGame.players[id])
      localGame.players[id].merge(state.players[id]);
    else
      localGame.players[id] = new Player(state.players[id]);
  }
  // merge in bomb state from server or create them locally
  for (var id in state.bombs) {
    if (localGame.bombs[id])
      localGame.bombs[id].merge(state.bombs[id]);
    else
      localGame.bombs[id] = new Bomb(state.bombs[id]);
  }
  // update each player sprite
  for (var id in localGame.players) {
    if (sprites[id]) {
      sprites[id].rotation = degToRad(localGame.players[id].angle);
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
  var key = codeToKey[e.keyCode];
  if (!key) return;
  // do nothing if we're already holding it down
  if (localGame.getPlayer(localPlayerId).keys[key]) return;
  localGame.getPlayer(localPlayerId).keys[key] = true;
  socket.emit('KEYDOWN', key);
});

document.addEventListener('keyup', function (e) {
  var key = codeToKey[e.keyCode];
  if (!key) return;
  socket.emit('KEYUP', key);
  localGame.getPlayer(localPlayerId).keys[key] = false;
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

// Client optimism
//localGame.physicsLoop();

// draw at 60fps
//function drawLoop () {
  //draw(localGame);
  //requestAnimationFrame(drawLoop);
//}
//drawLoop();
