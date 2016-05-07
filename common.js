
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

// ENTITIES

function left (e) { return e.pos.x; };
function right (e) { return e.pos.x + e.w; };
function top (e) { return e.pos.y; };
function bottom (e) { return e.pos.y + e.h; };

function Player (id, initX, initY) {
  this.id = id;
  // VECTORS
  this.pos = new Vector(initX || 0, initY || 0);
  this.vel = new Vector(1, 0);
  this.acc = new Vector(0, 0);
  this.angle = 45;
  this.w = 64;
  this.h = 64;
  this.keys = {
    UP: false, DOWN: false, LEFT: false, RIGHT: false
  };
  this.acceleration = 0.20;
  this.speed = 5;
  this.turnSpeed = 200; // degs per second
  this.maxSpeed = 2;
  this.color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
  // SHOOTING
  this.lastShot = new Date(0);
  this.shotCooldown = 500; // ms
}

////////////////////////////////////////////////////////////

// The server and client run their own game instance. The client
// merges server state broadcasts into its game instance.
function Game (data) {
  data = data || {};
  this.w = this.width = data.width || 1200 || 600 || 300;
  this.h = this.height = data.height || 600 || 300 || 200;
  this.players = data.players || Object.create(null);
  // each player's velocity is multiplied by the friction scalar
  // in every frame.
  this.airFriction = 0.995;
  // loops
  this.physicsInterval = data.physicsInterval || 15;
  this.broadcastInterval = data.broadCastInterval || 45;
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

// parameters like player turnSpeed and moveSpeed are
// measured in the amount a player will turn/move in 1 second.
//
// this function adjusts the value against the fraction of
// the second since the last physics loop.
function adjust (deltaMs, val) {
  //return Math.round(val * deltaMs / 1000);
  return val * deltaMs / 1000;
}

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
      var deltaAngle = adjust(deltaMs, player.turnSpeed);
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
    // Add velocity to position
    player.pos = player.pos.add(player.vel);
    // Clamp position to level boundary
    // TODO: Replace with a bounds check that also resets velocity
    player.pos = player.pos.clampX(0, this.w).clampY(0, this.h);
    // Apply air friction to ship
    player.vel = player.vel.mult(this.airFriction);
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

////////////////////////////////////////////////////////////

exports = typeof exports === 'undefined' ? {} : exports;
exports.Player = Player;
exports.Game = Game;
