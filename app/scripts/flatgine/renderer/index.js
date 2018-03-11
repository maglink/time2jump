var Camera = require('./camera');
var Animation = require('./animation');

module.exports = function(ctx, world) {
    var _self = this;

    _self.ctx = ctx;
    _self.world = world;
    _self.camera = new Camera();
    _self.animation = Animation(_self);

    _self.isDebug = false;
    _self.beforeHandlers = [];
    _self.textures = {};

    _self.LoadImage = function (imageUrl) {
        _self.getTexture(imageUrl);
        return imageUrl;
    };

    _self.BeforeRender = function(handler) {
        if(typeof handler === 'function') {
            _self.beforeHandlers.push(handler);
        }
    };

    _self.getTexture = function(path) {
        if(typeof path === 'object') {
            path = path.GetCurrentImage()
        }

        if(_self.textures[path]) {
            return _self.textures[path]
        }
        var img = new Image();
        img.src = path;
        _self.textures[path] = img;
        return img
    };

    _self.update = function () {
        _self.camera.update();

        _self.beforeHandlers.forEach(function (handler) { handler(); });

        _self.ctx.clearRect(0, 0, _self.ctx.canvas.width, _self.ctx.canvas.height);
        _self.ctx.imageSmoothingEnabled = false;
        _self.drawBackground();
        _self.drawGrid('back');
        _self.drawBodies(false);
        _self.drawGrid('main');
        _self.drawBodies(true);
    };

    _self.drawBackground = function () {
        var map = _self.world.map;
        if(map.backgroundcolor){
            _self.ctx.beginPath();
            _self.ctx.rect(0, 0, _self.ctx.canvas.width, _self.ctx.canvas.height);
            _self.ctx.fillStyle = map.backgroundcolor;
            _self.ctx.fill();
            _self.ctx.closePath();
        }
    };

    _self.drawBodies = function (inFront) {
        var map = _self.world.map;
        var bodies = _self.world.bodies;

        Object.keys(bodies).forEach(function (id) {
            var body = bodies[id];
            if(inFront !== body.renderer.front) {
                return;
            }

            var x, y;

            if(body.renderer.image) {
                var texture = _self.getTexture(body.renderer.image);

                x = _self.ctx.canvas.width/2 + ((body.physics.x+body.physics.width/2) - _self.camera.x) * _self.camera.zoomRate * map.tilewidth;
                y = _self.ctx.canvas.height/2 - ((body.physics.y-body.physics.height/2) - _self.camera.y) * _self.camera.zoomRate * map.tileheight;

                _self.ctx.translate(x, y);
                if(body.renderer.angle) {
                    _self.ctx.rotate(body.renderer.angle);
                }
                if(body.renderer.flip) {
                    _self.ctx.scale(-1, 1);
                }
                if(body.renderer.flipY) {
                    _self.ctx.scale(1, -1);
                }
                //-----------
                _self.ctx.drawImage(
                    texture,
                    (-texture.width/2 + body.renderer.xOffset) * body.renderer.xScale * _self.camera.zoomRate,
                    (-texture.height/2 + body.renderer.yOffset) * body.renderer.yScale * _self.camera.zoomRate,
                    texture.width * body.renderer.xScale * _self.camera.zoomRate,
                    texture.height * body.renderer.yScale * _self.camera.zoomRate
                );
                //-----------
                if(body.renderer.flipY) {
                    _self.ctx.scale(1, -1);
                }
                if(body.renderer.flip) {
                    _self.ctx.scale(-1, 1);
                }
                if(body.renderer.angle) {
                    _self.ctx.rotate(-body.renderer.angle);
                }
                _self.ctx.translate(-x, -y);
            } else if(body.renderer.color || _self.isDebug) {
                _self.drawBodyRectangle(body)
            }

            if(body.renderer.label) {
                x = _self.ctx.canvas.width/2 + ((body.physics.x+body.physics.width/2) - _self.camera.x) * _self.camera.zoomRate * map.tilewidth;
                y = _self.ctx.canvas.height/2 - ((body.physics.y-body.physics.height/2) - _self.camera.y) * _self.camera.zoomRate * map.tileheight;

                _self.ctx.font = body.renderer.label.font || "10px Arial";
                _self.ctx.fillStyle = body.renderer.label.fillStyle || "black";
                _self.ctx.textAlign = "center";
                _self.ctx.fillText(body.renderer.label.text, x, y);
            }

            if(_self.isDebug) {
                var centerX = x+width/2;
                var centerY = y+height/2;

                _self.ctx.beginPath();
                _self.ctx.moveTo(centerX,centerY);
                _self.ctx.lineTo(centerX,centerY - body.physics.vy*map.tileheight*_self.camera.zoomRate);
                _self.ctx.lineWidth = 2;
                _self.ctx.strokeStyle = '#ff0000';
                _self.ctx.stroke();


                _self.ctx.beginPath();
                _self.ctx.moveTo(centerX,centerY);
                _self.ctx.lineTo(centerX + body.physics.vx*map.tilewidth*_self.camera.zoomRate,centerY);
                _self.ctx.lineWidth = 2;
                _self.ctx.strokeStyle = '#00ff00';
                _self.ctx.stroke();
            }
        })
    };

    _self.drawBodyRectangle = function (body) {
        var map = _self.world.map;

        var x = _self.ctx.canvas.width/2 + (body.physics.x - _self.camera.x) * _self.camera.zoomRate * map.tilewidth;
        var y = _self.ctx.canvas.height/2 - (body.physics.y - _self.camera.y) * _self.camera.zoomRate * map.tileheight;
        var width = body.physics.width * map.tilewidth * _self.camera.zoomRate;
        var height = body.physics.height * map.tileheight * _self.camera.zoomRate;

        _self.ctx.beginPath();
        _self.ctx.rect(x, y, width, height);
        _self.ctx.fillStyle = body.renderer.color || "#5574ff";
        _self.ctx.fill();
        _self.ctx.closePath();
    };

    _self.drawGrid = function (gridName) {
        var map = _self.world.map;

        var startJ = Math.floor(_self.camera.x - _self.ctx.canvas.width/2/_self.camera.zoomRate/map.tilewidth);
        var endJ = Math.ceil(_self.camera.x + _self.ctx.canvas.width/2/_self.camera.zoomRate/map.tilewidth);

        var startI = Math.floor(-1 *(_self.camera.y + _self.ctx.canvas.height/2/_self.camera.zoomRate/map.tileheight));
        var endI = Math.ceil(-1 *(_self.camera.y - _self.ctx.canvas.height/2/_self.camera.zoomRate/map.tileheight));

        if(startI < 0) {
            startI = 0
        }
        if(startJ < 0) {
            startJ = 0
        }
        if(endI > map.grid.length) {
            endI = map.grid.length
        }

        for(var i=startI;i<endI;i++){
            if(endJ > map.grid[i].length) {
                endJ = map.grid[i].length
            }
            for(var j=startJ;j<endJ;j++){
                if(gridName === 'back') _self.drawGridCell(map.back, i, j);
                if(gridName === 'main') _self.drawGridCell(map.grid, i, j);
            }
        }
    };

    _self.drawGridCell = function (grid, i, j) {
        var map = _self.world.map;

        if(!grid || !grid[i] || !grid[i][j] || !grid[i][j].image) {
            return
        }

        var cell = grid[i][j];
        var texture = _self.getTexture(cell.image);
        var x = j*map.tilewidth + (cell.imageOffsetX||0);
        var y = -1*i*map.tileheight + (cell.imageOffsetY||0);

        _self.ctx.drawImage(
            texture,
            _self.ctx.canvas.width/2 + (x - _self.camera.x*map.tilewidth) * _self.camera.zoomRate,
            _self.ctx.canvas.height/2 - (y - _self.camera.y*map.tileheight) * _self.camera.zoomRate,
            texture.width * _self.camera.zoomRate,
            texture.height * _self.camera.zoomRate
        );

        if(_self.isDebug) {
            _self.ctx.font = "10px Arial";
            _self.ctx.fillStyle = "black";
            _self.ctx.textAlign = "center";
            _self.ctx.fillText("(" + i + "," + j + ")",
                _self.ctx.canvas.width/2 + (x - _self.camera.x*map.tilewidth) * _self.camera.zoomRate + map.tilewidth * _self.camera.zoomRate/2,
                _self.ctx.canvas.height/2 - (y - _self.camera.y*map.tileheight) * _self.camera.zoomRate + map.tileheight * _self.camera.zoomRate/2
            );
        }
    };

    return _self;
};