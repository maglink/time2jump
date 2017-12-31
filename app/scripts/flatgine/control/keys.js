var $ = require('jquery');

module.exports = function() {
    var _self = this;

    _self.bindings = {};

    _self.AddKeyHandlers = function(options) {
        _self.bindings[options.keyName] = {
            pressed: false,
            keyChars: options.keyChars,
            handlerPress: (typeof options.handlerPress === 'function') ? options.handlerPress : null,
            handlerRelease: (typeof options.handlerRelease === 'function') ? options.handlerRelease : null
        };
    };

    _self.UpdateKeyChars = function(keyName, keyChars) {
        if(_self.bindings[keyName]) {
            _self.bindings[keyName].keyChars = keyChars
        }
    };

    _self.RemoveKeyHandlers = function(keyName) {
        if(_self.bindings[keyName]) {
            delete _self.bindings[keyName];
        }
    };

    var BodySelector = "body";
    var BodyElem = $(BodySelector);
    BodyElem.on("keydown", function(event) {
        Object.keys(_self.bindings).forEach(function(bindKey){
            var bind = _self.bindings[bindKey];
            if(bind.keyChars.indexOf(event.key) === -1) return;
            if(bind.pressed) return;
            bind.pressed = true;
            if(bind.handlerPress) {
                bind.handlerPress();
            }
        });
    });

    BodyElem.on("keyup", function(event) {
        Object.keys(_self.bindings).forEach(function(bindKey){
            var bind = _self.bindings[bindKey];
            if(bind.keyChars.indexOf(event.key) === -1) return;
            bind.pressed = false;
            if(bind.handlerRelease) {
                bind.handlerRelease();
            }
        });
    });

    return _self;
};

/*
var keys = {
    up: new Key(["ArrowUp", "w", " "]),
    left: new Key(["ArrowLeft", "a"]),
    down: new Key(["ArrowDown", "s"]),
    right: new Key(["ArrowRight", "d"]),
    fight: new Key(["f"])
};*/