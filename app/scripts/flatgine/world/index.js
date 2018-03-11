module.exports = function(game) {
    var _self = this;

    _self.game = game;

    _self.AddBody = function(options) {
        options = options || {};
        var id = "body_" + _self.bodyIdCounter++;
        var gap = 0.00000000001;
        var body = {
            id: id,
            type: options.type,
            eventsListeners: {
                onDestroy: [],
                onGridTouch: [],
                onObjectTouch: [],
                onZoneIn: [],
                onZoneOut: []
            },
            physics: {
                id: id,
                isStatic: options.isStatic,
                x: options.x || 0,
                y: options.y || 0,
                vx: options.vx || 0,
                vy: options.vy || 0,
                width: options.width-gap || 1-gap,
                height: options.height-gap || 1-gap,
                density: options.density,
                bounce: options.bounce,
                friction: options.friction,
                noCollideObjects: options.noCollideObjects
            },
            renderer: {
                color: options.color,
                image: options.image,
                flip: options.flip,
                angle: options.angle,
                xOffset: options.xOffset || 0,
                yOffset: options.yOffset || 0,
                xScale: options.xScale || 1,
                yScale: options.yScale || 1,
                front: false
            }
        };
        if(options.mass) {
            body.physics.density = body.mass/body.physics.width*body.physics.height;
        }
        if(typeof body.renderer.image === 'string') {
            _self.game.renderer.LoadImage(body.renderer.image);
        }
        _self.bodies[id] = body;
        return body;
    };

    _self.RemoveBody = function(body) {
        if(_self.bodies[body.id]) {
            _self.bodies[body.id].eventsListeners.onDestroy.forEach(function (handler) {
                handler()
            });
            delete _self.bodies[body.id];
        }
    };

    _self.RemoveCell = function(cell) {
        if(cell && _self.map.grid[-cell.y]) {
            _self.map.grid[-cell.y][cell.x] = null;
        }
    };

    _self.AddBodyEventListener = function(body, eventName, handler) {
        if(typeof handler !== 'function' || !body.eventsListeners[eventName]){
            return null;
        }
        body.eventsListeners[eventName].push(handler);
        return true;
    };

    _self.LoadMap = function (mapData, texturePrefix) {
        try {
            if(mapData["renderorder"] !== "left-up") {
                return new Error("the order of tiles map not acceptable");
            }

            var map = {};

            map.tileheight = mapData.tileheight;
            map.tilewidth = mapData.tilewidth;
            map.backgroundcolor = mapData.backgroundcolor;

            var tiles = _self.loadTilePacks(mapData);
            for(var i=0;i<mapData.layers.length;i++) {
                var layer = mapData.layers[i];
                if(layer.type === "tilelayer" && layer.name === "base"){
                    _self.loadGrid(map, layer, tiles, texturePrefix)
                }
                if(layer.type === "tilelayer" && layer.name === "back"){
                    _self.loadBack(map, layer, tiles, texturePrefix)
                }
                if(layer.type === "objectgroup" && layer.name === "zones"){
                    _self.loadZones(map, layer, tiles, texturePrefix)
                }
            }

            _self.map = map;
            _self.bodyIdCounter = 0;
            _self.bodies = {};
        } catch (err) {
            return err;
        }
    };

    _self.loadTilePacks = function(data) {
        var tiles = {};

        for(var i=0;i<data.tilesets.length;i++) {
            var tileset = data.tilesets[i];
            var start = tileset.firstgid;
            Object.keys(tileset.tiles).forEach(function(key){
                var tile = tileset.tiles[key];
                if(tileset.tileproperties) {
                    tile.properties = tileset.tileproperties[key];
                }
                key = Number(key);
                tiles[start+key] = tile;
            })
        }

        return tiles;
    };

    _self.loadGrid = function(map, layer, tiles, imagePrefix) {
        map.grid = [];

        var count = 0;
        for(var i=0;i<layer.height;i++) {
            map.grid[i] = [];
            for(var j=0;j<layer.width;j++) {
                var tileType = layer.data[count++];
                if(tileType === 0) {
                    map.grid[i][j] = null;
                    continue;
                }

                var imageUrl = imagePrefix + tiles[tileType].image;
                _self.game.renderer.LoadImage(imageUrl);

                map.grid[i][j] = {
                    x: j,
                    y: -i,
                    image: imageUrl,
                    type: tiles[tileType].type,
                    properties: tiles[tileType].properties || {}
                };

                if(map.grid[i][j].type === 'invisible') {
                    map.grid[i][j].image = null
                }
            }
        }
    };

    _self.loadBack = function(map, layer, tiles, imagePrefix) {
        map.back = [];

        var count = 0;
        for(var i=0;i<layer.height;i++) {
            map.back[i] = [];
            for(var j=0;j<layer.width;j++) {
                var tileType = layer.data[count++];
                if(tileType === 0) {
                    map.back[i][j] = null;
                    continue;
                }

                var imageUrl = imagePrefix + tiles[tileType].image;
                _self.game.renderer.LoadImage(imageUrl);

                map.back[i][j] = {
                    x: j,
                    y: -i,
                    image: imageUrl,
                    type: tiles[tileType].type,
                    properties: tiles[tileType].properties || {}
                };
            }
        }
    };

    _self.loadZones = function(map, layer, tiles, imagePrefix) {
        map.zones = [];

        layer.objects.forEach(function (item) {
            var zone = {
                name: item.name,
                x: item.x/map.tilewidth,
                y: -item.y/map.tileheight,
                width: item.width/map.tilewidth,
                height: item.height/map.tileheight
            };

            zone.centerX = zone.x+zone.width/2;
            zone.centerY = zone.y-zone.height/2;

            map.zones.push(zone);
        })
    };

    _self.AddZone = function(name, x, y, width, height) {
        var zone = {
            name: name,
            x: x || 0,
            y: y || 0,
            width: width || 1,
            height: height || 1
        };

        zone.centerX = zone.x+zone.width/2;
        zone.centerY = zone.y-zone.height/2;

        _self.map.zones.push(zone);

        return zone;
    };

    _self.SetBodyPositionByZone = function (body, zoneName) {
        var zone = _self.map.zones.filter(function(zone){return zone.name === zoneName;})[0];
        if(zone) {
            body.physics.x = zone.centerX - body.physics.width/2;
            body.physics.y = zone.centerY + body.physics.height/2;
        }
    };

    _self.RemoveZoneByName = function (zoneName) {
        _self.map.zones = _self.map.zones.filter(function(zone){return zone.name !== zoneName;});
    };

    _self.GetGridBlocksByType = function (type) {
        var grid = _self.map.grid;
        var resultList = [];
        for(var i=0;i<grid.length;i++) {
            for (var j = 0; j < grid[i].length; j++) {
                if(grid[i][j] && grid[i][j].type === type) {
                    resultList.push(grid[i][j])
                }
            }
        }
        return resultList;
    };

    return _self;
};