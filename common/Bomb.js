
// 3rd
var _ = require('lodash');
// 1st
var Entity = require('./Entity');
var Vector = require('./Vector');
var belt = require('./belt');

function Bomb (data) {
  data = data || {};
  Entity.call(this, data);
  this.playerId = data.playerId;
  // OVERRIDES
  // - Hitbox is smaller than sprite
  this.w = 2; // actual = 18
  this.h = 2; // actual = 18
  this.bounciness = 1.0; // no friction
  // EXTENSIONS
  this.maxFlightTime = 3.0; // in seconds
  this.currFlightTime = 0;
  // TODO: 0 = no bounce. null = bounce forever;
  // this.bouncesLeft = 1;
}

Bomb.prototype = _.create(Entity.prototype, {
  constructor: Bomb
});

// merge in state broadcast from the server
// only the stuff that changes between frames
Bomb.prototype.mergeM = function (state) {
  this.pos.mergeM(state.pos);
  this.vel.mergeM(state.vel);
  return this;
};

module.exports = Bomb;
