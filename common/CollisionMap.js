
// CollisionMap implementation taken with permission 
// from ImpactJS <http://impactjs.com/>
// Authored by Dominic Szablewski
//
// Note: Impact's entity positions are anchored top-left.
//       Mine are anchored in their center. I translate into Impact coords
//       before tracing, but at the callsite so that I don't need to
//       change this file.

var Map = require('./Map');

var H = 1/2;
var N = 1/3;
var M = 2/3;
var SOLID = true;
var NON_SOLID = false;
var defaultTileDef = {	
	/* 15 NE */	 5: [0,1, 1,M, SOLID],  6: [0,M, 1,N, SOLID],  7: [0,N, 1,0, SOLID],
	/* 22 NE */	 3: [0,1, 1,H, SOLID],  4: [0,H, 1,0, SOLID],
	/* 45 NE */  2: [0,1, 1,0, SOLID],
	/* 67 NE */ 10: [H,1, 1,0, SOLID], 21: [0,1, H,0, SOLID],
	/* 75 NE */ 32: [M,1, 1,0, SOLID], 43: [N,1, M,0, SOLID], 54: [0,1, N,0, SOLID],
	
	/* 15 SE */	27: [0,0, 1,N, SOLID], 28: [0,N, 1,M, SOLID], 29: [0,M, 1,1, SOLID],
	/* 22 SE */	25: [0,0, 1,H, SOLID], 26: [0,H, 1,1, SOLID],
	/* 45 SE */	24: [0,0, 1,1, SOLID],
	/* 67 SE */	11: [0,0, H,1, SOLID], 22: [H,0, 1,1, SOLID],
	/* 75 SE */	33: [0,0, N,1, SOLID], 44: [N,0, M,1, SOLID], 55: [M,0, 1,1, SOLID],
	
	/* 15 NW */	16: [1,N, 0,0, SOLID], 17: [1,M, 0,N, SOLID], 18: [1,1, 0,M, SOLID],
	/* 22 NW */	14: [1,H, 0,0, SOLID], 15: [1,1, 0,H, SOLID],
	/* 45 NW */	13: [1,1, 0,0, SOLID],
	/* 67 NW */	 8: [H,1, 0,0, SOLID], 19: [1,1, H,0, SOLID],
	/* 75 NW */	30: [N,1, 0,0, SOLID], 41: [M,1, N,0, SOLID], 52: [1,1, M,0, SOLID],
	
	/* 15 SW */ 38: [1,M, 0,1, SOLID], 39: [1,N, 0,M, SOLID], 40: [1,0, 0,N, SOLID],
	/* 22 SW */ 36: [1,H, 0,1, SOLID], 37: [1,0, 0,H, SOLID],
	/* 45 SW */ 35: [1,0, 0,1, SOLID],
	/* 67 SW */  9: [1,0, H,1, SOLID], 20: [H,0, 0,1, SOLID],
	/* 75 SW */ 31: [1,0, M,1, SOLID], 42: [M,0, N,1, SOLID], 53: [N,0, 0,1, SOLID],
	
	/* Go N  */ 12: [0,0, 1,0, NON_SOLID],
	/* Go S  */ 23: [1,1, 0,1, NON_SOLID],
	/* Go E  */ 34: [1,0, 1,1, NON_SOLID],
	/* Go W  */ 45: [0,1, 0,0, NON_SOLID]
};


function CollisionMap (tilesize, data) {
  Map.call(this, tilesize, data);
  this.tiledef = defaultTileDef;
}

CollisionMap.prototype = new Map();

// Does a trace from (x, y) to (x+sx,y+sy) for an object of given height.
// Returns trace result:
//   { 
//     collision: { x: false, y: false, slope: Slope | null }
//     pos: { x:0, y:0 }
//     tile: { x:0, y:0 }
//   }
// Slope object: {
//   x: 0, y: 0, 
//   nx: 0, ny: 0 <-- the slope normal
// }
CollisionMap.prototype.trace = function (x, y, vx, vy, objectWidth, objectHeight) {
  // setup trace result
  var result = {
    collision: { x: null, y: null, slope: null },
    pos: { x: x, y: y },
    tile: { x: 0, y: 0 }
  };
  // break the trace down into smaller steps if necessary
  var steps = Math.ceil(Math.max(Math.abs(vx), Math.abs(vy)) / this.tilesize);
  // handle just one step
  if (steps === 1) {
    this._traceStep(result, x, y, vx, vy, objectWidth, objectHeight, vx, vy, 0);
  } else { // steps > 1
    var sx = vx / steps;
    var sy = vy / steps;
    for (var i = 0; i < steps && (sx || sy); i++) {
      this._traceStep(result, x, y, sx, sy, objectWidth, objectHeight, vx, vy, i);
      x = result.pos.x;
      y = result.pos.y;
      if (result.collision.x) { sx = 0; vx = 0; }
      if (result.collision.y) { sy = 0; vy = 0; }
      if (result.collision.slope) break;
    }
  }
  return result;
};

CollisionMap.prototype._traceStep = function (result, x, y, vx, vy, width, height, rvx, rvy, step) {
  result.pos.x += vx;
  result.pos.y += vy;
  var t = 0;
  // Horizontal collision (walls)
  if (vx) {
    var pxOffsetX = (vx > 0 ? width : 0);
    var tileOffsetX = (vx < 0 ? this.tilesize : 0);
    var firstTileY = Math.max(Math.floor(y / this.tilesize), 0);
    var lastTileY = Math.min(Math.ceil((y + height) / this.tilesize), this.height);
    var tileX = Math.floor((result.pos.x + pxOffsetX) / this.tilesize);
    
    // We need to test the new tile position as well as the current one, as we
    // could still collide with the current tile if it's a line def.
    // We can skip this test if this is not the first step or the new tile position
    // is the same as the current one.
    var prevTileX = Math.floor((x + pxOffsetX) / this.tilesize);
    if (step > 0 || tileX == prevTileX || prevTileX < 0 || prevTileX >= this.width) {
      prevTileX = -1;
    }
    
    // Still inside this collision map?
    if (tileX >= 0 && tileX < this.width) {
      for (var tileY = firstTileY; tileY < lastTileY; tileY++) {
        if(prevTileX != -1) {
          t = this.data[tileY][prevTileX];
          if(	
            t > 1 && t <= this.lastSlope && 
            this._checkTileDef(result, t, x, y, rvx, rvy, width, height, prevTileX, tileY) 
          ) {
            break;
          }
        }
        
        t = this.data[tileY][tileX];
        if (
          t == 1 || t > this.lastSlope || // fully solid tile?
          (t > 1 && this._checkTileDef(result, t, x, y, rvx, rvy, width, height, tileX, tileY)) // slope?
        ) {
          if ( t > 1 && t <= this.lastSlope && result.collision.slope ) {
            break;
          }
          
          // full tile collision!
          result.collision.x = true;
          result.tile.x = t;
          x = result.pos.x = tileX * this.tilesize - pxOffsetX + tileOffsetX;
          rvx = 0;
          break;
        }
      }
    }
  }
  // Vertical collision (floor, ceiling)
  if (vy) {
    var pxOffsetY = (vy > 0 ? height : 0);
    var tileOffsetY = (vy < 0 ? this.tilesize : 0);
    
    var firstTileX = Math.max( Math.floor(result.pos.x / this.tilesize), 0 );
    var lastTileX = Math.min( Math.ceil((result.pos.x + width) / this.tilesize), this.width );
    var tileY = Math.floor( (result.pos.y + pxOffsetY) / this.tilesize );
    
    var prevTileY = Math.floor( (y + pxOffsetY) / this.tilesize );
    if( step > 0 || tileY == prevTileY || prevTileY < 0 || prevTileY >= this.height ) {
      prevTileY = -1;
    }
    
    // Still inside this collision map?
    if( tileY >= 0 && tileY < this.height ) {
      for( var tileX = firstTileX; tileX < lastTileX; tileX++ ) {
        if( prevTileY != -1 ) {
          t = this.data[prevTileY][tileX];
          if( 
            t > 1 && t <= this.lastSlope &&
            this._checkTileDef(result, t, x, y, rvx, rvy, width, height, tileX, prevTileY) ) {
            break;
          }
        }
        
        t = this.data[tileY][tileX];
        if(
          t == 1 || t > this.lastSlope || // fully solid tile?
          (t > 1 && this._checkTileDef(result, t, x, y, rvx, rvy, width, height, tileX, tileY)) // slope?
        ) {
          if( t > 1 && t <= this.lastSlope && result.collision.slope ) {
            break;
          }
          
          // full tile collision!
          result.collision.y = true;
          result.tile.y = t;
          result.pos.y = tileY * this.tilesize - pxOffsetY + tileOffsetY;
          break;
        }
      }
    }
  }
  
  // result is changed in place, nothing to return
};

CollisionMap.prototype._checkTileDef = function (res, t, x, y, vx, vy, width, height, tileX, tileY) {
    var def = this.tiledef[t];
		if( !def ) { return false; }
		
		var lx = (tileX + def[0]) * this.tilesize,
			ly = (tileY + def[1]) * this.tilesize,
			lvx = (def[2] - def[0]) * this.tilesize,
			lvy = (def[3] - def[1]) * this.tilesize,
			solid = def[4];
		
		// Find the box corner to test, relative to the line
		var tx = x + vx + (lvy < 0 ? width : 0) - lx,
			ty = y + vy + (lvx > 0 ? height : 0) - ly;
		
		// Is the box corner behind the line?
		if( lvx * ty - lvy * tx > 0 ) {
			
			// Lines are only solid from one side - find the dot product of
			// line normal and movement vector and dismiss if wrong side
			if( vx * -lvy + vy * lvx < 0 ) {
				return solid;
			}
			
			// Find the line normal
			var length = Math.sqrt(lvx * lvx + lvy * lvy);
			var nx = lvy/length,
				ny = -lvx/length;
			
			// Project out of the line
			var proj = tx * nx + ty * ny;
			var px = nx * proj,
				py = ny * proj;
			
			// If we project further out than we moved in, then this is a full
			// tile collision for solid tiles.
			// For non-solid tiles, make sure we were in front of the line. 
			if( px*px+py*py >= vx*vx+vy*vy ) {
				return solid || (lvx * (ty-vy) - lvy * (tx-vx) < 0.5);
			}
			
			res.pos.x = x + vx - px;
			res.pos.y = y + vy - py;
			res.collision.slope = {x: lvx, y: lvy, nx: nx, ny: ny};
			return true;
		}
		
		return false;
};

module.exports = CollisionMap;
