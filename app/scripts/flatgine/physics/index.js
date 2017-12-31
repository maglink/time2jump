module.exports = function(world) {
    var _self = this;

    _self.world = world;

    _self.gravity = 9.8;
    _self.timeFrequency = 1000/30;
    _self.timeRate = 1;
    _self.defaultBounce = 0.02;
    _self.defaultFriction = 0.2;
    _self.defaultDensity = 1;

    _self.beforeHandlers = [];
    _self.Before = function(handler) {
        if(typeof handler === 'function') {
            _self.beforeHandlers.push(handler);
        }
    };

    _self.afterHandlers = [];
    _self.After = function(handler) {
        if(typeof handler === 'function') {
            _self.afterHandlers.push(handler);
        }
    };

    _self.setTimeFrequency = function(frequency) {
        _self.timeFrequency = frequency;
    };

    _self.getPieceOfTime = function(){
        return 1000/_self.timeFrequency/_self.timeRate;
    };

    _self.update = function () {
        _self.beforeHandlers.forEach(function (handler) { handler(); });

        var bodies = _self.world.bodies;
        Object.keys(bodies).forEach(function (id) {
            var body = bodies[id].physics;

            if(body.isStatic) {
                return;
            }

            _self.applyGravity(body);

            var dx = body.vx/_self.getPieceOfTime();
            var dy = body.vy/_self.getPieceOfTime();

            var maxD = 0.49999999;

            if(dx > maxD) dx = maxD;
            if(dx < -maxD) dx = -maxD;
            if(dy > maxD) dy = maxD;
            if(dy < -maxD) dy = -maxD;

            var collisions;
            var resolveResult;

            body.x += dx;
            _self.checkCollisions(body, 'x');
            collisions = _self.checkGridCollisions(body, 'x');
            if(collisions.length) {
                resolveResult = _self.resolveGridCollision(body, collisions[0], 'x');
                resolveResult.cells = collisions.map(function(c){return c.cell});
                _self.emitEvent(bodies[id], 'onGridTouch', resolveResult);
            }

            body.y += dy;
            _self.checkCollisions(body, 'y');
            collisions = _self.checkGridCollisions(body, 'y');
            if(collisions.length) {
                resolveResult = _self.resolveGridCollision(body, collisions[0], 'y');
                resolveResult.cells = collisions.map(function(c){return c.cell}).sort(function(a, b){
                    var bodyCenterX = body.x + body.width/2;
                    return Math.abs((a.x+0.5)-bodyCenterX) > Math.abs((b.x+0.5)-bodyCenterX);
                });
                _self.emitEvent(bodies[id], 'onGridTouch', resolveResult);
            }

            _self.checkZones(body);
        });

        _self.afterHandlers.forEach(function (handler) { handler(); });
    };

    _self.checkZones = function (body) {
        body.zones = body.zones || [];
        _self.world.map.zones.forEach(function (zone) {
            if(_self.isCollision(body, zone)) {
                if(body.zones.indexOf(zone.name) === -1) {
                    body.zones.push(zone.name);
                    _self.emitEvent(_self.world.bodies[body.id], 'onZoneIn', zone);
                }
            } else {
                var index= body.zones.indexOf(zone.name);
                if(index !== -1) {
                    body.zones.splice(index, 1);
                    _self.emitEvent(_self.world.bodies[body.id], 'onZoneOut', zone);
                }
            }
        })
    };

    _self.emitEvent = function(body, eventName, eventData) {
        body.eventsListeners[eventName].forEach(function(handler) {
            setTimeout(function(){
                handler(eventData)
            }, 0)
        })
    };

    _self.applyGravity = function (body) {
        body.density = body.density ? body.density : _self.defaultDensity;
        body.vy += -(_self.gravity*body.density)/_self.getPieceOfTime();
    };

    _self.checkCollisions = function(body, axis) {
        if(body.noCollideObjects) {
            return
        }

        var bodies = _self.world.bodies;
        Object.keys(bodies).forEach(function (id) {
            var other = bodies[id].physics;
            if(other === body) {
                return;
            }
            if(other.noCollideObjects) {
                return
            }

            if(_self.isCollision(body, other)) {

                if(body.collideObjectsFilter) {
                    if(!body.collideObjectsFilter(bodies[id], axis)) {
                        return
                    }
                }
                if(other.collideObjectsFilter) {
                    if(!other.collideObjectsFilter(_self.world.bodies[body.id], axis)) {
                        return
                    }
                }

                _self.resolveCollision(body, other, axis)
            }
        });
    };

    _self.resolveCollision = function (body, other, axis) {
        var bodyCenter = {
            x: body.x+body.width/2,
            y: body.y-body.height/2
        };
        var otherCenter = {
            x: other.x+other.width/2,
            y: other.y-other.height/2
        };

        var gap = 0.00000000001;

        body.density = body.density ? body.density : _self.defaultDensity;
        other.density = other.density ? other.density : _self.defaultDensity;
        body.mass = body.width * body.height * body.density;
        other.mass = other.width * other.height * other.density;

        var side;

        if(axis === 'x') {
            if(bodyCenter.x < otherCenter.x) {
                body.x = other.x - body.width - gap;
                side = 'right'
            } else {
                body.x = other.x + other.width + gap;
                side = 'left'
            }

            body.vx *= body.mass/(body.mass + other.mass);
            other.vx *= other.mass/(body.mass + other.mass);

            var resultVX = other.vx + body.vx;
            body.vx = resultVX;
            other.vx = resultVX;
            body.vx = Math.floor(Math.abs(body.vx)*100) === 0 ? 0 : body.vx;
            other.vx = Math.floor(Math.abs(other.vx)*100) === 0 ? 0 : other.vx;

            body.vy *= 1 - _self.getFriction(body, other);
            body.vx *= -1 * _self.getBounce(body, other);
        }

        if(axis === 'y') {
            if (bodyCenter.y > otherCenter.y) {
                body.y = other.y + body.height + gap;
                side = 'bottom'
            } else {
                body.y = other.y - other.height - gap;
                side = 'top'
            }

            body.vy *= body.mass/(body.mass + other.mass);
            other.vy *= other.mass/(body.mass + other.mass);

            var resultVY = other.vy + body.vy;
            body.vy = resultVY;
            other.vy = resultVY;
            body.vy = Math.floor(Math.abs(body.vy)*100) === 0 ? 0 : body.vy;
            other.vy = Math.floor(Math.abs(other.vy)*100) === 0 ? 0 : other.vy;

            body.vx *= 1 - _self.getFriction(body, other);
            body.vy *= -1 * _self.getBounce(body, other);
        }

        _self.emitEvent(_self.world.bodies[body.id], 'onObjectTouch', {
            object: _self.world.bodies[other.id],
            axis: axis,
            side: side
        });
        var inverseSide = (axis === 'y') ? (side === 'bottom' ? 'top' : 'bottom') : (side === 'left' ? 'right' : 'left');
        _self.emitEvent(_self.world.bodies[other.id], 'onObjectTouch', {
            object: _self.world.bodies[body.id],
            axis: axis,
            side: inverseSide
        });
    };

    _self.checkGridCollisions = function (body, axis) {
        var map = _self.world.map;

        var startI = Math.floor(-1 * body.y);
        var endI = Math.floor(-1 * (body.y - body.height));

        var startJ = Math.floor(body.x);
        var endJ = Math.floor(body.x+body.width);

        if(endJ < 0 || endI < 0 || startI > map.grid.length-1 || startJ > map.grid[0].length-1) {
            return [];
        }

        startI = startI < 0 ? 0 : startI;
        startJ = startJ < 0 ? 0 : startJ;
        endI = endI > map.grid.length-1 ? map.grid.length-1 : endI;
        endJ = endJ > map.grid[0].length-1 ? map.grid[0].length-1 : endJ;

        var list = [];
        for(var i = startI;i <= endI; i++){
            for(var j = startJ;j <= endJ; j++){
                var cell = map.grid[i][j];
                if(cell && !cell.noCollideObjects) list.push({
                    i: i,
                    j: j,
                    cell: cell
                });
                if(cell && cell.noCollideObjects) {
                    _self.emitEvent(_self.world.bodies[body.id], 'onGridTouch', {
                        axis: axis,
                        cells: [cell]
                    });
                }
            }
        }

        return list;
    };

    _self.resolveGridCollision = function (body, collision, axis) {
        var cellBody = {
            x: collision.j,
            y: -collision.i,
            width: 1,
            height: 1
        };
        var cellCenter = {
            x: cellBody.x+cellBody.width/2,
            y: cellBody.y-cellBody.height/2
        };
        var bodyCenter = {
            x: body.x+body.width/2,
            y: body.y-body.height/2
        };

        var gap = 0.00000000001;

        var side;

        if(axis === 'x') {
            if(bodyCenter.x < cellCenter.x) {
                body.x = cellBody.x - body.width - gap;
                side = 'right';
            } else {
                body.x = cellBody.x + cellBody.width + gap;
                side = 'left';
            }
            body.vy *= 1 - _self.getFriction(body, cellBody);
            body.vx *= -1 * _self.getBounce(body, cellBody);
            body.vx = Math.floor(Math.abs(body.vx)*100) === 0 ? 0 : body.vx;
        }

        if(axis === 'y') {
            if(bodyCenter.y > cellCenter.y) {
                body.y = cellBody.y + body.height + gap;
                side = 'bottom';
            } else {
                body.y = cellBody.y - cellBody.height - gap;
                side = 'top';
            }
            body.vx *= 1 - _self.getFriction(body, cellBody);
            body.vy *= -1 * _self.getBounce(body, cellBody);
            body.vy = Math.floor(Math.abs(body.vy)*100) === 0 ? 0 : body.vy;
        }

        return {
            axis: axis,
            side: side
        }
    };

    _self.getBounce = function(body, other) {
        var bounce = _self.defaultBounce;
        if(body.bounce && other.bounce) {
            bounce = body.bounce > other.bounce ? body.bounce : other.bounce;
        } else {
            bounce = body.bounce ? body.bounce : bounce;
            bounce = other.bounce ? other.bounce : bounce;
        }
        return bounce
    };

    _self.getFriction = function(body, other) {
        var friction = _self.defaultFriction;
        if(body.friction && other.friction) {
            friction = body.friction < other.friction ? body.friction : other.friction;
        } else {
            friction = typeof body.friction === 'number' ? body.friction : friction;
            friction = typeof other.friction === 'number' ? other.friction : friction;
        }
        return friction
    };

    _self.isCollision = function(object1, object2) {
        _self.calcCenterAndHalfSize(object1);
        _self.calcCenterAndHalfSize(object2);
        if ( Math.abs(object1.center.x - object2.center.x) > object1.halfSize.x + object2.halfSize.x ) return false;
        if ( Math.abs(object1.center.y - object2.center.y) > object1.halfSize.y + object2.halfSize.y ) return false;
        return true;
    };

    _self.calcCenterAndHalfSize = function (body) {
        body.halfSize = {
            x: body.width/2,
            y: body.height/2
        };
        body.center = {
            x: body.x + body.halfSize.x,
            y: body.y - body.halfSize.y
        };
    };


    return _self;
};