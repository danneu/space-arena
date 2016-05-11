
// 3rd
var _ = require('lodash');
// 1st
var Entity = require('./Entity');
var Vector = require('./Vector');
var belt = require('./belt');

function Bullet (data) {
  data = data || {};
  Entity.call(this, data);
  this.playerId = data.playerId;
  // OVERRIDES
  this.w = 7;
  this.h = 6;
  this.bounciness = 1.0; // no friction
  // EXTENSIONS
  this.maxFlightTime = 1.0; // in seconds
  this.currFlightTime = 0;
  // TODO: 0 = no bounce. null = bounce forever;
  // this.bouncesLeft = 1;
}

Bullet.prototype = _.create(Entity.prototype, {
  constructor: Bullet
});

// merge in state broadcast from the server
// only the stuff that changes between frames
Bullet.prototype.mergeM = function (state) {
  this.pos.mergeM(state.pos);
  this.vel.mergeM(state.vel);
  return this;
};

module.exports = Bullet;
