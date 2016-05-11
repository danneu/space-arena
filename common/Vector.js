
var belt = require('./belt');

// http://blog.wolfire.com/2009/07/linear-algebra-for-game-developers-part-1/
// Positions given in meters
// Velocities in meters per second
// Player input changes the ship's acceleration. The game simulation
// updates their position and velocity with phyiscs integration (via
// vector addition)

// The methods that end in "M" mutate the underlying vector
// The methods that don't will return a new Vector object

function Vector (x, y) {
  this.x = x;
  this.y = y;
}

// CLASS

Vector.fromDeg = function (deg) {
  var rad = belt.degToRad(deg);
  return new Vector(Math.sin(rad), -Math.cos(rad));
};

// INSTANCE

Vector.prototype.mergeM = function (state) {
  this.x = state.x;
  this.y = state.y;
  return this;
};

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

Vector.prototype.addM = function (v2) {
  this.x += v2.x;
  this.y += v2.y;
  return this;
}

// i.e. the hypotenuse of the vector
// a ship's speed = ship.vel.length();
Vector.prototype.length = function () {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};

// https://en.wikipedia.org/wiki/Normal_(geometry)
Vector.prototype.perpendicular = function () {
  return new Vector(-this.y, this.x);
};

Vector.prototype.perpendicularM = function () {
  var originalX = this.x;
  this.x = -this.y;
  this.y = originalX;
  return this;
};

Vector.prototype.distance = function (v2) {
  return this.subtract(v2).length();
};

Vector.prototype.subtract = function (v2) {
  return new Vector(this.x - v2.x, this.y - v2.y);
};

Vector.prototype.subtractM = function (v2) {
  this.x -= v2.x;
  this.y -= v2.y;
  return this;
};

Vector.prototype.multiply = function (scalar) {
  return new Vector(this.x * scalar, this.y * scalar);
};

Vector.prototype.multiplyM = function (scalar) {
  this.x *= scalar;
  this.y *= scalar;
  return this;
};

Vector.prototype.divide = function (scalar) {
  return new Vector(this.x / scalar, this.y / scalar);
};

Vector.prototype.divideM = function (scalar) {
  this.x /= scalar;
  this.y /= scalar;
  return this;
};


// set vector's length to 1
Vector.prototype.normalize = function () {
  var len = this.length();
  var x = this.x / len;
  var y = this.y / len;
  return new Vector(x, y);
};

Vector.prototype.normalizeM = function () {
  var len = this.length();
  this.x /= len;
  this.y /= len;
  return this;
};

Vector.prototype.dotProduct = function (v2) {
  return this.x * v2.x + this.y * v2.y;
};

// TODO : Handle V(0, 0);
Vector.prototype.deg = function () {
  var ang = belt.radToDeg(Math.atan(-this.y / -this.x));
  if (this.x == 0) {
    if (this.y > 0) return 180;
    else return 0;
  }
  if (this.x > 0) return 90 + ang;
  if (this.x < 0) return 270 + ang;
};

module.exports = Vector;

