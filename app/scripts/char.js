module.exports = function(game, onCharDie) {
    var _self = this;

    _self.game = game;
    _self.body = null;

    _self.charWidth = 0.9;
    _self.charHeight = 0.9;
    _self.charBigHeight = 1.9;

    _self.CreateBody = function (game) {
        _self.body = game.world.AddBody({
            width: _self.charWidth,
            image: _self.imageStand
        });
        _self.body.renderer.front = true;

        _self.game.world.AddBodyEventListener(_self.body, 'onGridTouch', function (event) {

        });
        _self.body.physics.collideObjectsFilter = function(other){

        };
        _self.game.world.AddBodyEventListener(_self.body, 'onObjectTouch', function (event) {

        });
        game.world.AddBodyEventListener(_self.body, 'onZoneIn', function (zone) {

        });
        game.world.AddBodyEventListener(_self.body, 'onZoneOut', function (zone) {

        });
    };

    _self.game.controlKeys.AddKeyHandlers({
        keyName: "right",
        keyChars: ["ArrowRight", "D", "d", "В", "в"],
        handlerPress: function () {

        },
        handlerRelease: function () {

        }
    });

    _self.game.physics.Before(function () {

    });

    _self.game.physics.After(function () {
        _self.beforeRender();
    });

    _self.setImage = function(image) {
        var old = _self.body.renderer.image;
        if(old === image) {
            return;
        }
        if(old && old.Stop) {
            old.Stop();
        }
        _self.body.renderer.image = image;
        if(image && image.Play) {
            image.Play();
        }
    };


    _self.imageStand = _self.game.renderer.LoadImage('files/char/warrior_stand.png');

    _self.beforeRender = function () {
        _self.setImage(_self.imageStand);
    };

    return _self;
};