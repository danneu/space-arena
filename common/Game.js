
// 3rd
var _ = require('lodash');
// 1st
var Entity = require('./Entity');
var Vector = require('./Vector');
var Player = require('./Player');
var Bomb = require('./Bomb');
var Bullet = require('./Bullet');
var Level = require('./Level');
var belt = require('./belt');


// The server and client run their own game instance. The client
// merges server state broadcasts into its game instance.
function Game (data) {
  data = data || Object.create(null);
  this.level = Level.defaultLevel;
  this.w = this.level.w;
  this.h = this.level.h;
  this.players = data.players || Object.create(null);
  this.bombs = data.bombs || Object.create(null);
  this.bullets = data.bullets || Object.create(null);
  // each player's velocity is multiplied by the friction scalar
  // in every frame.
  this.airFriction = 0.995;
  // loops
  this.physicsInterval = data.physicsInterval || 15;
  this.broadcastInterval = data.broadCastInterval || 45;
}

// TODO: implemented in client.js and reuse there
Game.prototype.mergeState = function (state) {
  this.players = state.players;
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

// Simulate a game tick.
// tick = seconds since last step (deltaMs / 1000)
Game.prototype.step = function (tick) {
  // Move players
  for (var id in this.players) {
    var player = this.players[id];
    // Handle turning input
    if (player.keys.LEFT || player.keys.RIGHT) {
      var deltaAngle = player.turnSpeed * tick;
      if (player.keys.LEFT) player._subangle = belt.mod(player._subangle - deltaAngle, 360);
      if (player.keys.RIGHT) player._subangle = belt.mod(player._subangle + deltaAngle, 360);
      // clamp to nearest 9 degrees
      player.angle = belt.nearestMultiple(player._subangle, 9);
    }
    // Handle acceleration input
    if (player.keys.UP || player.keys.DOWN) {
      var newVector = Vector.fromDeg(player.angle);
      if (player.keys.DOWN) newVector.multiplyM(-1);
      newVector.multiplyM(player.thrust);
      player.acc = newVector;
    } else {
      // no keys pressed = no acceleration
      player.acc.multiplyM(0);
    }
    // Apply acceleration to velocity
    player.vel.addM(player.acc.multiply(tick));
    // Enforce max speed
    if (player.vel.length() > player.maxSpeed) {
      player.vel.multiplyM(player.maxSpeed / player.vel.length());
    }
    // Check player against collisionMap

    var result = player.traceCollision(this.level.collisionMap);
    player.handleMovementTrace(result);
    // Apply air friction to ship
    if (player.speed() > 0.10) {
      player.vel.multiplyM(this.airFriction);
    }
    // HANDLE BOMB INPUT
    if (player.keys.D && new Date() - player.lastBomb >= player.bombCooldown && player.currEnergy >= player.bombCost) {
      var bomb = new Bomb({
        playerId: player.id,
        pos: player.nose(),
        vel: Vector.fromDeg(player.angle).multiplyM(3).addM(player.vel.multiply(0.5))
      });
      this.bombs[bomb.id] = bomb;
      // spend the energy
      player.currEnergy -= player.bombCost;
      // reset bomb cooldown
      player.lastBomb = new Date();
    }
    // HANDLE BULLET INPUT
    if (player.keys.S && new Date() - player.lastBullet >= player.bulletCooldown && player.currEnergy >= player.bulletCost) {
      var bullet = new Bullet({
        playerId: player.id,
        pos: player.nose(),
        vel: Vector.fromDeg(player.angle).multiplyM(3).addM(player.vel.multiply(0.5))
      });
      this.bullets[bullet.id] = bullet;
      // spend the energy
      player.currEnergy -= player.bulletCost;
      // reset bomb cooldown
      player.lastBullet = new Date();
    }
    // RECHARGE ENERGY
    player.currEnergy = Math.min(player.totalEnergy, Math.round(player.currEnergy + player.rechargeRate * tick));
  }
  // MOVE EACH BOMB
  for (var id in this.bombs) {
    var bomb = this.bombs[id];
    // see if bomb has hit its flying limit
    if (bomb.currFlightTime > bomb.maxFlightTime) {
      delete this.bombs[bomb.id];
    }
    // World collision check
    //var mx = bomb.vel.x * tick;
    //var my = bomb.vel.y * tick;
    var result = bomb.traceCollision(this.level.collisionMap);
    bomb.handleMovementTrace(result);
    bomb.currFlightTime += tick;
  }
  // MOVE EACH BULLET
  for (var id in this.bullets) {
    var bullet = this.bullets[id];
    // see if bomb has hit its flying limit
    if (bullet.currFlightTime > bullet.maxFlightTime) {
      delete this.bullets[bullet.id];
    }
    // World collision check
    //var mx = bomb.vel.x * tick;
    //var my = bomb.vel.y * tick;
    var result = bullet.traceCollision(this.level.collisionMap);
    bullet.handleMovementTrace(result);
    bullet.currFlightTime += tick;
  }
  // TODO: CHECK BOMB<->PLAYER COLLISIONS
  // TODO: CHECK BULLET<->PLAYER COLLISIONS
};

Game.prototype.physicsLoop = function () {
  var self = this;
  var prev = Date.now();
  function _step () {
    self.step((Date.now() - prev) / 1000);
    prev = Date.now();
  }
  setInterval(_step, self.physicsInterval);
};

module.exports = Game;
