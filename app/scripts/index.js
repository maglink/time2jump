var $ = require('jquery');
var async = require('async');
var Flatgine = require('./flatgine');
var Char = require('./char.js');

var canvasElement = $('#canvas').get(0);

var game = new Flatgine(canvasElement);
game.physics.gravity = 9.8;
var mapData;

function LoadSources(cb) {
    async.series([
        function(cb) {
            $.getJSON( "files/maps/map1.json", function(data) {
                mapData = data;
                cb();
            })
        }
    ], cb);
}

LoadSources(function () {
    game.Run(1000/30);

    var char = new Char(game, function(){
        //on Die
    });
    game.char = char;

    function onResize() {
        canvasElement.width  = window.innerWidth;
        canvasElement.height = window.innerHeight;
    }
    $(window).resize(onResize);
    onResize();

    LoadLevel();
});

function LoadLevel() {
    var loadmapError = game.world.LoadMap(mapData, 'files/maps/');
    console.error(loadmapError);

    game.char.CreateBody(game);
    game.world.SetBodyPositionByZone(game.char.body, "player");


    game.renderer.camera.SetPositionByBody(game.char.body);
    game.renderer.camera.Follow(game.char.body);
    game.renderer.camera.SetZoom(0.5);



}
