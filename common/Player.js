
// 3rd
var _ = require('lodash');
// 1st
var Entity = require('./Entity');
var Vector = require('./Vector');
var belt = require('./belt');

function Player (data) {
  data = data || {};
  Entity.call(this, data);
  // VECTORS
  this.angle = data.angle || 45;
  this.keys = {
    UP: false, DOWN: false, LEFT: false, RIGHT: false
  };
  this.turnSpeed = 200; // degs per second
  this.color = data.color || '#'+(Math.random()*0xFFFFFF<<0).toString(16);
  // OVERRIDES
  this.w = data.w || 64;
  this.h = data.h || 64;
  this.acceleration = data.acceleration || 3;
  this.bounciness = data.bounciness || 0.75;
  this.minBounceVelocity = data.minBounceVelocity || 0.75;
  this.maxSpeed = data.maxSpeed || 3;
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
  // TODO: EXTENSIONS: BULLETS
}

Player.prototype = _.create(Entity.prototype, {
  constructor: Player
});

// merge in state broadcast from the server
// only the stuff that changes between frames
Player.prototype.mergeM = function (state) {
  this.pos.mergeM(state.pos);
  this.vel.mergeM(state.vel);
  this.acc.mergeM(state.acc);
  this.angle = state.angle;
  this.keys = state.keys;
  this.currEnergy = state.currEnergy;
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
