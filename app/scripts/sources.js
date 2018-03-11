var $ = require('jquery');
var async = require('async');

module.exports.setProgress = function (progress) {
    $("#loader .progress-bar span").css('width',progress+'%');
};


var filesList = [
    'files/char/run/1.png',
    'files/char/run/2.png',
    'files/char/run/3.png',
    'files/char/run/4.png',
    'files/char/run/5.png',
    'files/char/run/6.png',
    'files/char/stand/1.png',
    'files/char/stand/2.png',
    'files/char/stand/3.png',
    'files/char/stand/4.png',
    'files/char/stand/5.png',
    'files/char/stand/6.png',
    'files/char/stand/7.png',
    'files/char/stand/8.png',
    'files/char/stand/9.png',
    'files/char/stand/10.png',
    'files/char/stand/11.png',
    'files/char/jump.png',

    'files/maps/textures/light-stick-off.png',
    'files/maps/textures/light-stick-on.png',
    'files/maps/textures/panel.png',
    'files/maps/textures/panel2.png',
    'files/maps/textures/panels-2x2.png',
    'files/maps/textures/piston-off.png',
    'files/maps/textures/piston-on.png',
    'files/maps/textures/piston-platform.png',
    'files/maps/textures/piston-platform-1.png',
    'files/maps/textures/piston-platform-revers.png',
    'files/maps/textures/stone.png',
    'files/maps/textures/virtual-block-1.png',
    'files/maps/textures/virtual-block-2.png',

    //'files/sounds/block-moving.wav',
    'files/sounds/footsteps.wav',
    'files/sounds/piston.wav',
    'files/sounds/switch.wav',
    //'files/sounds/virtual-block.wav',
    //'files/sounds/warp.wav',

    'files/warp/1.png',
    'files/warp/2.png',
    'files/warp/3.png',
    'files/warp/4.png',
    'files/warp/5.png',
    'files/warp/6.png',
    'files/warp/7.png',
    'files/warp/8.png',
    'files/warp/9.png',
    'files/warp/10.png',
    'files/warp/11.png'
];

module.exports.loadFiles = function(cb) {
    var _self = this;

    var filesProcessed = 0;

    async.eachLimit(filesList, 10, function(fileUrl, cb) {
        $.get(fileUrl, function() {
            filesProcessed++;
            _self.setProgress(Math.floor((filesProcessed/filesList.length)*100*((100-10)/100))+10);
            cb();
        });
    }, cb);
};