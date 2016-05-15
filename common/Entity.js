
var Vector = require('./Vector');
var belt = require('./belt');

function Entity (data) {
  data = data || {};
  data.pos = data.pos || {};
  data.vel = data.vel || {};
  data.acc = data.acc || {};
  this.id = data.id || belt.uid();
  // VECTORS
  this.pos = new Vector(data.pos.x || 100, data.pos.y || 100);
  this.vel = new Vector(data.vel.x || 1, data.vel.y || 0);
  this.acc = new Vector(data.acc.x || 0, data.acc.y || 0);
  // SIZE
  this.w = data.w;
  this.h = data.h;
  // PARAMS
  this.acceleration = 0;
  this.bounciness = 0;
  this.minBounceVelocity = 0;
  this.maxSpeed = 3;
}

// i.e. length of the entity's velocity vector
Entity.prototype.speed = function () {
  return this.vel.length();
};

Entity.prototype.mergeM = function () {
  throw new Error('child must implement');
};

// returns collisionmap result
Entity.prototype.traceCollision = function (collisionMap) {
  var result = collisionMap.trace(
    // translate our center-anchored position coords into 
    // top-left-anchored coords
    this.pos.x - this.w/2
  , this.pos.y - this.h/2
  , this.vel.x
  , this.vel.y
  , this.w
  , this.h
  );
  // translate Impact's top-left anchored coords back into 
  // our center-anchored coords
  result.pos.x += this.w/2;
  result.pos.y += this.h/2;
  return result;
};

// mutates entity's velocity and position
// CollisionMapResult -> void
Entity.prototype.handleMovementTrace = function (result) {
  if (result.collision.y) {
    if (this.bounciness > 0 && Math.abs(this.vel.y) > this.minBounceVelocity) {
      this.vel.y *= -this.bounciness;
    } else {
      this.vel.y = 0;
    }
    // friction
    this.vel.x *= 0.9;
  }
  if (result.collision.x) {
    if (this.bounciness > 0 && Math.abs(this.vel.x) > this.minBounceVelocity) {
      this.vel.x *= -this.bounciness;
    } else {
      this.vel.x = 0;
    }
    // friction
    this.vel.y *= 0.9;
  }
  this.pos.mergeM(result.pos);
};

module.exports = Entity;
