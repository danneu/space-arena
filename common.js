
//
// This file is intended to be shared on the server and client.
//

// http://blog.wolfire.com/2009/07/linear-algebra-for-game-developers-part-1/
// Positions given in meters
// Velocities in meters per second
// Player input changes the ship's acceleration. The game simulation
// updates their position and velocity with phyiscs integration (via
// vector addition)

function Vector (x, y) {
  this.x = x;
  this.y = y;
}

Vector.prototype.clampX = function (min, max) {
  var x = this.x;
  if (x > max) x = max;
  if (x < min) x = min;
  return new Vector(x, this.y);
}

Vector.prototype.clampY = function (min, max) {
  var y = this.y;
  if (y > max) y = max;
  if (y < min) y = min;
  return new Vector(this.x, y);
}

Vector.prototype.add = function (v2) {
  return new Vector(this.x + v2.x, this.y + v2.y);
}

// i.e. the hypotenuse of the vector
// a ship's speed = ship.vel.length();
Vector.prototype.length = function () {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};

// https://en.wikipedia.org/wiki/Normal_(geometry)
Vector.prototype.perp = function () {
  return new Vector(-this.y, this.x);
};

Vector.prototype.distance = function (v2) {
  return this.subtract(v2).length();
};

Vector.prototype.subtract = function (v2) {
  return new Vector(this.x - v2.x, this.y - v2.y);
};

Vector.prototype.mult = function (scalar) {
  return new Vector(this.x * scalar, this.y * scalar);
};

Vector.prototype.divide = function (scalar) {
  return new Vector(this.x / scalar, this.y / scalar);
};

// set vector's length to 1
Vector.prototype.normalize = function () {
  var len = this.length();
  var x = this.x / len;
  var y = this.y / len;
  return new Vector(x, y);
};

Vector.prototype.dotProduct = function (v2) {
  return this.x * v2.x + this.y * v2.y;
};

// TODO : Handle V(0, 0);
Vector.prototype.deg = function () {
  var ang = radToDeg(Math.atan(-this.y / -this.x));
  if (this.x == 0) {
    if (this.y > 0) return 180;
    else return 0;
  }
  if (this.x > 0) return 90 + ang;
  if (this.x < 0) return 270 + ang;
};

// MATH HELPERS

// mod(-1, 100) -> 99
// mod(101, 100) -> 1
function mod (n, d) {
  return ((n % d) + d) % d;
}

function degToRad (deg) {
  return deg * (Math.PI / 180);
}

function radToDeg (rad) {
  return rad * (180 / Math.PI);
}

// UTILITY HELPERS

// increasing number generator
var uid = (function () {
  var id = 0;
  return function () {
    return ++id;
  }
})();

// LEVEL

function Level (data) {
  data = data || {};
  this.raw = data.raw;
  this.tilesize = 16;
  this.w = this.raw[0].length * this.tilesize;
  this.h = this.raw.length * this.tilesize;
  console.log('level WxH =', this.w, this.h);
}

var level = new Level({
  raw: [
    '11111111111111111111111111111111111111111111111111',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001', // 10
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001', // 20
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '10000000000000000000000000000000000000000000000001',
    '11111111111111111111111111111111111111111111111111' // 30
  ].map(function (row) {
    return row.split('');
  })
});

// ENTITIES

function Entity (data) {
  data = data = {};
  data.pos = data.pos || {};
  data.vel = data.vel || {};
  this.id = data.id || uid();
  // VECTORS
  this.pos = new Vector(data.pos.x || 100, data.pos.y || 100);
  this.vel = new Vector(data.vel.x || 1, data.vel.y || 0);
  this.w = data.w || 16;
  this.h = data.h || 16;
}

Entity.prototype.left = function () {
  return this.pos.x - this.w/2;
};

Entity.prototype.right = function () {
  return this.pos.x + this.w/2;
};

Entity.prototype.top = function () {
  return this.pos.y - this.h/2;
};

Entity.prototype.bottom = function () {
  return this.pos.y + this.h/2;
};


// i.e. length of the entity's velocity vector
Entity.prototype.speed = function () {
  return this.vel.length();
};

Player.prototype = new Entity();
Bomb.prototype = new Entity();

function Bomb (data) {
  data.pos = data.pos || {};
  data.vel = data.vel || {};
  Entity.call(this, data);
  this.id = data.id || uid();
  this.playerId = data.playerId;
  // VECTORS
  this.pos = new Vector(data.pos.x || 100, data.pos.y || 100);
  this.vel = new Vector(data.vel.x || 1, data.vel.y || 0);
}

// merge in state broadcast from the server
// only the stuff that changes between frames
Bomb.prototype.merge = function (state) {
  this.pos = new Vector(state.pos.x, state.pos.y);
  this.vel = new Vector(state.vel.x, state.vel.y);
};


function Player (data) {
  data = data || {};
  data.pos = data.pos || {};
  data.vel = data.vel || {};
  data.acc = data.acc || {};
  Entity.call(this, data);
  this.id = data.id || uid();
  // VECTORS
  this.pos = new Vector(data.pos.x || 100, data.pos.y || 100);
  this.vel = new Vector(data.vel.x || 1, data.vel.y || 0);
  this.acc = new Vector(data.acc.x || 0, data.acc.y || 0);
  this.angle = data.angle || 45;
  this.w = data.w || 64;
  this.h = data.h || 64;
  this.keys = {
    UP: false, DOWN: false, LEFT: false, RIGHT: false
  };
  this.acceleration = 0.05;
  this.maxSpeed = 3;
  this.turnSpeed = 200; // degs per second
  this.color = data.color || '#'+(Math.random()*0xFFFFFF<<0).toString(16);
  // BOMBS
  this.lastBomb = new Date(0);
  this.bombCooldown = 1000; // ms
  this.bombBounces = 0; // bounces left. 0 = doesn't bounce.
}

// merge in state broadcast from the server
// only the stuff that changes between frames
Player.prototype.merge = function (state) {
  this.pos = new Vector(state.pos.x, state.pos.y);
  this.vel = new Vector(state.vel.x, state.vel.y);
  this.acc = new Vector(state.acc.x, state.acc.y);
  this.angle = state.angle;
  this.keys = state.keys;
};

// returns (x, y) position vector
Player.prototype.nose = function () {
  var r = this.w / 2;
  var noseX = this.pos.x + r * Math.cos(degToRad(this.angle - 90));
  var noseY = this.pos.y + r * Math.sin(degToRad(this.angle - 90));
  return new Vector(noseX, noseY);
};

////////////////////////////////////////////////////////////

// The server and client run their own game instance. The client
// merges server state broadcasts into its game instance.
function Game (data) {
  data = data || Object.create(null);
  this.level = level;
  this.w = this.level.w;
  this.h = this.level.h;
  this.players = data.players || Object.create(null);
  this.bombs = data.bombs || Object.create(null);
  // each player's velocity is multiplied by the friction scalar
  // in every frame.
  this.airFriction = 0.995;
  // loops
  this.physicsInterval = data.physicsInterval || 15; // 66 times per sec
  this.broadcastInterval = data.broadCastInterval || 45; // 22 times per sec
}

Game.prototype.mergeState = function (newState) {
  this.players = newState.players;
};

Game.prototype.getPlayer = function (id) {
  return this.players[id];
};

Game.prototype.addPlayer = function (player) {
  this.players[player.id] = player;
  return this;
};

Game.prototype.removePlayer = function (id) {
  var player = this.players[id];
  delete this.players[id];
  return player;
};

function degToVector (deg) {
  var rad = degToRad(deg);
  return new Vector(Math.sin(rad), -Math.cos(rad));
}

// Simulate a game tick.
Game.prototype.step = function (deltaMs) {
  // Move players
  for (var id in this.players) {
    var player = this.players[id];
    // Handle turning input
    if (player.keys.LEFT || player.keys.RIGHT) {
      var deltaAngle = player.turnSpeed * deltaMs / 1000;
      if (player.keys.LEFT) player.angle = mod(player.angle - deltaAngle, 360);
      if (player.keys.RIGHT) player.angle = mod(player.angle + deltaAngle, 360);
    }
    // Handle acceleration input
    if (player.keys.UP || player.keys.DOWN) {
      var newVector = degToVector(player.angle);
      if (player.keys.DOWN) newVector = newVector.mult(-1);
     newVector = newVector.mult(player.acceleration);
      player.acc = newVector;
    } else {
      // no keys pressed = no acceleration
      player.acc = player.acc.mult(0);
    }
    // Apply acceleration to velocity
    player.vel = player.vel.add(player.acc);
    // Enforce max speed
    if (player.vel.length() > player.maxSpeed) {
      player.vel = player.vel.mult(player.maxSpeed / player.vel.length());
    }
    // Add velocity to position
    player.pos = player.pos.add(player.vel);
    // Clamp position to level boundary
    // TODO: Replace with a bounds check that also resets velocity
    player.pos = player.pos.clampX(0, this.w).clampY(0, this.h);
    // Apply air friction to ship
    if (player.speed() > 0.10) {
      player.vel = player.vel.mult(this.airFriction);
    }
    // END: MOVE
    // START: HANDLE BULLET INPUT
    if (player.keys.S && new Date() - player.lastBomb >= player.bombCooldown) {
      var bomb = new Bomb({
        playerId: player.id,
        pos: player.nose(),
        //vel: player.vel
        vel: degToVector(player.angle).mult(3).add(player.vel.mult(0.5))
      });
      this.bombs[bomb.id] = bomb;
      // reset bomb cooldown
      player.lastBomb = new Date();
    }
  }
  // MOVE EACH BOMB
  for (var id in this.bombs) {
    var bomb = this.bombs[id];
    // Add velocity to position
    bomb.pos = bomb.pos.add(bomb.vel);
    // Remove bomb if it's out of rectangular level bounds
    if (this.outOfBounds(bomb)) {
      delete this.bombs[bomb.id];
    }
  }
};

Game.prototype.physicsLoop = function () {
  var self = this;
  var prev = Date.now();
  function _step () {
    self.step(Date.now() - prev);
    prev = Date.now();
  }
  setInterval(_step, self.physicsInterval);
};

// Entity -> Bool
Game.prototype.outOfBounds = function (e) {
  return e.left() < 0 ||
    e.right() > this.w ||
    e.top() < 0 ||
    e.bottom() > this.h;
};

////////////////////////////////////////////////////////////

exports = typeof exports === 'undefined' ? {} : exports;
exports.Player = Player;
exports.Game = Game;
