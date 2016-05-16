
// 3rd
var _ = require('lodash');
// 1st
var Entity = require('./Entity');
var Vector = require('./Vector');
var belt = require('./belt');

function Player (data) {
  data = data || {};
  Entity.call(this, data);
  // OVERRIDES
  this.w = 30;
  this.h = 30;
  this.thrust = data.thrust || 3;
  this.bounciness = data.bounciness || 0.75;
  this.minBounceVelocity = data.minBounceVelocity || 0.10;
  this.maxSpeed = data.maxSpeed || 3;
  // EXTENSIONS: MOVEMENT
  // - angle is clamped to the nearest 9 degrees (40 possible nose positions)
  // - angle should be used in all calculations
  this.angle = data.angle || 45;
  // - subangle is 0-359 and used to calculate the clamped angle
  this._subangle = this.angle;
  this.turnSpeed = 200; // degs per second
  this.keys = {
    UP: false, DOWN: false, LEFT: false, RIGHT: false
  };
  // EXTENSIONS: ENERGY
  this.totalEnergy = 1000;
  this.currEnergy = this.totalEnergy;
  this.rechargeRate = 500; // per second
  this.bombCost = 500;
  this.bombDamage = 900;
  this.bulletCost = 50;
  this.bulletDamage = 100;
  // EXTENSIONS: BOMBS
  this.lastBomb = new Date(0);
  this.bombCooldown = 1000; // ms
  this.bombBounces = 0; // TODO: bounces left. 0 = doesn't bounce.
  // EXTENSIONS: BULLETS
  this.lastBullet = new Date(0);
  this.bulletCooldown = 50; //ms
}

Player.prototype = _.create(Entity.prototype, {
  constructor: Player
});

// really, to JSON object
Player.prototype.toJson = function () {
  return {
    id: this.id,
    pos: this.pos,
    vel: this.vel,
    w: this.w,
    h: this.h,
    angle: this.angle,
    currEnergy: this.currEnergy

  };
};

// merge in state broadcast from the server
// only the stuff that changes between frames
Player.prototype.mergeM = function (state) {
  this.pos.mergeM(state.pos);
  this.angle = state.angle;
  if (state.vel) this.vel.mergeM(state.vel);
  if (state.acc) this.acc.mergeM(state.acc);
  if (state.keys) this.keys = state.keys;
  if (state.currEnergy) this.currEnergy = state.currEnergy;
  return this;
};

// returns (x, y) position vector
Player.prototype.nose = function () {
  var r = this.w / 2;
  var noseX = this.pos.x + r * Math.cos(belt.degToRad(this.angle - 90));
  var noseY = this.pos.y + r * Math.sin(belt.degToRad(this.angle - 90));
  return new Vector(noseX, noseY);
};

module.exports = Player;
