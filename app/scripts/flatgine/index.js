var Physics = require('./physics');
var Renderer = require('./renderer');
var World = require('./world');
var Sounds = require('./sounds');
var ControlKeys = require('./control/keys.js');

module.exports = function(canvas) {
    var _self = this;

    _self.ctx = canvas.getContext("2d");

    _self.world = new World(_self);
    _self.physics = new Physics(_self.world);
    _self.renderer = new Renderer(_self.ctx, _self.world);
    _self.sounds = new Sounds();
    _self.controlKeys = new ControlKeys();

    _self.Run = function (updateInterval) {
        updateInterval = updateInterval ? updateInterval : 1000/30;
        if(updateInterval > 1000) updateInterval = 1000;
        if(_self.updateInterval) {
            clearInterval(_self.updateInterval)
        }
        _self.updateInterval = setInterval(function() {
            if(!_self.world.map) {
                return;
            }
            _self.physics.update();
            _self.renderer.update();
        }, updateInterval);
        _self.physics.setTimeFrequency(updateInterval);
        _self.renderer.camera.setFrequency(updateInterval)
    };

    return _self;
};