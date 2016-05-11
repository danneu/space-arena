
// data is 2d array
function Map (tilesize, data) {
  this.tilesize = tilesize || 16;
  this.data = data || [[]];
  // height and width are in tile units
  this.width = this.data[0].length;
  this.height = this.data.length;
  this.pxWidth = this.width * this.tilesize;
  this.pxHeight = this.height * this.tilesize;
}

// x and y are gameworld pixel coords
Map.prototype.getTile = function (x, y) {
  var tileX = Math.floor(x / this.tilesize);
  var tileY = Math.floor(y / this.tilesize);
  if (tileX >= 0 && tileX < this.width && tileY >= 0 && tileY < this.width) {
    return this.data[tileX][tileY];
  } else {
    return 0;
  }
};

module.exports = Map;
