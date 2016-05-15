
// Utility belt functions

// mod(-1, 100) -> 99
// mod(101, 100) -> 1
exports.mod = function (n, d) {
  return ((n % d) + d) % d;
}

exports.degToRad = function (deg) {
  return deg * (Math.PI / 180);
}

exports.radToDeg = function (rad) {
  return rad * (180 / Math.PI);
}

// increasing number generator
exports.uid = (function () {
  var id = 0;
  return function () {
    return ++id;
  }
})();

// nearestMulitple(8, 9) => 9
// nearestMultiple(10, 9) => 9
// nearestMultiple(15, 9) => 18
// nearestMultiple(1, 9) => 0
//
// (Float, Int) => Int
exports.nearestMultiple = function (n, mult) {
  return mult * Math.round(n / mult);
};
