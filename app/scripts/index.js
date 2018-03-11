var $ = require('jquery');
var async = require('async');
var Flatgine = require('./flatgine');
var Char = require('./char.js');
var Sources = require('./sources.js');
var Sounds = require('./sounds.js');

var canvasElement = $('#canvas').get(0);

var game = new Flatgine(canvasElement);
game.physics.gravity = 9.8;
var mapData1;

function LoadSources(cb) {
    $("#loader").show();
    Sources.setProgress(0);

    async.series([
        function(cb) {
            $.getJSON( "files/maps/map1.json", function(data) {
                mapData1 = data;
                cb();
            })
        },
        function (cb) {
            Sources.loadFiles(cb)
        }
    ], cb);
}

LoadSources(function () {
    game.Run(1000/30);

    Sounds.LoadSounds(game);
    Sounds.LoadSoundsSettings(game);

    var onDestroyHandlers = [];
    var onDestroy = function(handler) {
        if(typeof handler === 'function') {
            onDestroyHandlers.push(handler)
        }
    };

    var char = new Char(game, function(event){
        console.log(event);
        onDestroyHandlers.forEach(function (handler) {
            handler();
        });
        onDestroyHandlers = [];

        $("#loader").show();
        Sources.setProgress(0);
        $.getJSON( "files/maps/map2.json", function(data) {
            LoadLevel(data, onDestroy);
            Sources.setProgress(100);
            $("#loader").fadeOut(500);
        })

    });
    game.char = char;

    function onResize() {
        canvasElement.width  = window.innerWidth;
        canvasElement.height = window.innerHeight;
    }
    $(window).resize(onResize);
    onResize();

    LoadLevel(mapData1, onDestroy);

    Sources.setProgress(100);
    $("#loader").fadeOut(500);
});

function LoadLevel(mapData, onDestroy) {
    var loadmapError = game.world.LoadMap(mapData, 'files/maps/');
    if(loadmapError) {
        console.error(loadmapError);
        return;
    }

    game.char.CreateBody(game);
    game.world.SetBodyPositionByZone(game.char.body, "player");

    game.renderer.camera.SetPositionByBody(game.char.body);
    game.renderer.camera.Follow(game.char.body, true);
    game.renderer.camera.SetZoom(1);

    game.sounds.PlayBackground('echoes_of_time');

    var warpImage = new game.renderer.animation({
        imagesCount: 11,
        imageUrl: function(i) {
            return 'files/warp/'+(i+1)+".png"
        },
        playSpeed: 1000/10
    }).Play();

    var virtualBlockImage = new game.renderer.animation({
        imagesCount: 2,
        imageUrl: function(i) {
            return 'files/maps/textures/virtual-block-'+(i+1)+".png"
        },
        playSpeed: 1000/16
    }).Play();

    game.world.map.zones.filter(function(zone){return zone.name === "warp";}).forEach(function (zone) {
        var warp = game.world.AddBody({
            type: "warp",
            image: warpImage,
            isStatic: true,
            x: zone.centerX - 0.5,
            y: zone.centerY + 0.5
        });

        var audio = new Audio();
        audio.src = 'files/sounds/warp.wav';
        audio.load();
        audio.loop = true;
        audio.originalVolume = 1;
        audio.volume = 0;
        game.sounds.OnMasterVolumeChange(function(volume){
            audio.volume = volume * audio.originalVolume;
        });
        audio.play();
        warp.audio = audio;

        var interval = setInterval(function() {
            var distance = Math.sqrt(Math.pow(warp.physics.x - game.char.body.physics.x, 2) + Math.pow(warp.physics.y - game.char.body.physics.y, 2));
            var multiplier = 1/Math.pow(distance, 2);
            if(multiplier > 1) multiplier = 1;

            warp.audio.volume = warp.audio.originalVolume * multiplier * game.sounds.masterVolume;
        }, 1000/30);

        onDestroy(function() {
            clearInterval(interval);
            audio.pause();
        })
    });

    var pistonBlock, virtualBlock, switch1, switch2;

    game.world.GetGridBlocksByType('switch_off').forEach(function (block) {
        block.noCollideObjects = true;
        block.state = "off";

        var zone = game.world.AddZone("switch"+Math.random(), block.x + 0.4, block.y, 0.2);
        zone.action = function() {
            game.sounds.Play('switch');
            if(block.state === "off") {
                block.state = "on";
                block.image = "files/maps/textures/light-stick-on.png"
            } else {
                block.state = "off";
                block.image = "files/maps/textures/light-stick-off.png"
            }

            if(switch1.state === "on") {
                pistonBlock.actionOn();
            } else if (switch1.state === "off") {
                pistonBlock.actionOff();
            }
            if(switch1.state === "off" && switch2.state === "on") {
                virtualBlock.actionOn();
            } else {
                virtualBlock.actionOff();
            }
        };

        if(block.x === 15 && block.y === -20) {
            switch2 = block;
        }
        if(block.x === 15 && block.y === -23) {
            switch1 = block;
        }
    });

    game.world.GetGridBlocksByType('virtual').forEach(function (block) {
        var audio = new Audio();
        audio.src = 'files/sounds/virtual-block.wav';
        audio.load();
        audio.loop = true;
        audio.originalVolume = 1;
        audio.volume = 0;
        game.sounds.OnMasterVolumeChange(function(volume){
            audio.volume = volume * audio.originalVolume;
        });
        block.audio = audio;

        var interval = setInterval(function() {
            var distance = Math.sqrt(Math.pow(block.x - game.char.body.physics.x, 2) + Math.pow(block.y - game.char.body.physics.y, 2));
            var multiplier = 4/Math.pow(distance, 2);
            if(multiplier > 1) multiplier = 1;

            block.audio.volume = block.audio.originalVolume * multiplier * game.sounds.masterVolume;
        }, 1000/30);

        onDestroy(function() {
            clearInterval(interval);
            audio.pause();
        });

        block.actionOn = function() {
            block.state = "on";
            block.image = virtualBlockImage;
            block.noCollideObjects = false;
            block.audio.play()
        };

        block.actionOff = function() {
            block.state = "off";
            block.image = null;
            block.noCollideObjects = true;
            block.audio.pause()
        };


        if(block.x === 23 && block.y === -20) {
            block.actionOff();
            virtualBlock = block;
        } else {
            block.actionOn();
        }
    });

    game.world.GetGridBlocksByType('stone').forEach(function (block) {
        var stone = game.world.AddBody({
            density: 50,
            type: "stone",
            image: "files/maps/textures/stone.png",
            x: block.x,
            y: block.y
        });

        game.world.RemoveCell(block);
    });

    game.world.GetGridBlocksByType('piston').forEach(function (block) {
        var piston = game.world.AddBody({
            isStatic: true,
            type: "piston platform",
            image: "files/maps/textures/piston-platform.png",
            x: block.x,
            y: block.y
        });

        var processInterval;
        var actionSpeed = 1000/30;
        var actionLength = 200;

        block.state = "off";
        block.actionOn = function() {
            if(block.state === "on") {
                return;
            }
            if(processInterval) {
                clearInterval(processInterval);
            }

            block.state = "on";
            block.image = "files/maps/textures/piston-on.png";


            game.sounds.Play('piston');
            var piece = 1/(actionLength/actionSpeed);
            processInterval = setInterval(function(){
                piston.physics.y += piece;

                if(piston.physics.y >= block.y+1) {
                    clearInterval(processInterval);
                    piston.physics.y = block.y+1;
                }
            }, actionSpeed)
        };

        block.actionOff = function() {
            if(block.state === "off") {
                return;
            }
            if(processInterval) {
                clearInterval(processInterval);
            }

            game.sounds.Play('piston');
            var piece = 1/(actionLength/actionSpeed);
            processInterval = setInterval(function(){
                piston.physics.y -= piece;

                if(piston.physics.y <= block.y) {
                    clearInterval(processInterval);
                    piston.physics.y = block.y;
                    block.state = "off";
                    block.image = "files/maps/textures/piston-off.png";
                }
            }, actionSpeed);
        };

        if(block.x === 17 && block.y === -25) {
            pistonBlock = block;
        }
    })
}

